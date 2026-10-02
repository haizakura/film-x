import { toast } from 'vue-sonner'
import { MAX_COMPOSITION_FRAMES } from '~/types/composition'
import type {
  CompositionFrameCount,
  CompositionImage,
  CompositionImageTransform
} from '~/types/composition'
import { errorMessageKey } from '~/utils/errors'
import { decodeImage, partitionSupportedImages } from '~/utils/image'

export const useCompositionImages = () => {
  const { t } = useI18n()
  const translateError = useTranslatedError()
  const images = shallowRef<Array<CompositionImage | undefined>>(
    Array.from({ length: MAX_COMPOSITION_FRAMES }, () => undefined)
  )
  const renderingCount = ref(0)
  const rendering = computed(() => renderingCount.value > 0)
  const decodeVersions = Array.from({ length: MAX_COMPOSITION_FRAMES }, () => 0)
  let disposed = false

  const placeFiles = async (assignments: Array<{ index: number; file: File }>) => {
    renderingCount.value += 1
    try {
      const decodedAssignments = await Promise.all(
        assignments.map(async ({ index, file }) => {
          const version = (decodeVersions[index] ?? 0) + 1
          decodeVersions[index] = version
          try {
            const decoded = await decodeImage(file)
            if (decodeVersions[index] !== version) {
              decoded.dispose()
              return undefined
            }
            return { index, file, decoded, version }
          } catch (error) {
            if (!disposed) {
              toast.error(t('toast.readFailed', { name: file.name }), {
                description: translateError(
                  errorMessageKey(error, 'errors.decodeFailed'),
                  'errors.decodeFailed'
                )
              })
            }
            return undefined
          }
        })
      )

      if (disposed) {
        decodedAssignments.forEach((assignment) => assignment?.decoded.dispose())
        return
      }

      const next = [...images.value]
      let changed = false
      for (const assignment of decodedAssignments) {
        if (!assignment) continue
        const { index, file, decoded, version } = assignment
        if (decodeVersions[index] !== version) {
          decoded.dispose()
          continue
        }
        next[index]?.decoded.dispose()
        next[index] = {
          name: file.name,
          decoded,
          transform: { scale: 1, offsetX: 0, offsetY: 0 }
        }
        changed = true
      }
      if (changed) images.value = next
    } finally {
      renderingCount.value -= 1
    }
  }

  const placeFile = async (index: number, file: File) => {
    const { supported } = partitionSupportedImages([file])
    const selected = supported[0]
    if (!selected) {
      toast.warning(t('toast.unsupportedFile'), {
        description: t('toast.chooseSupportedTypes')
      })
      return
    }
    await placeFiles([{ index, file: selected }])
  }

  const placeDroppedFiles = async (files: File[], slotCount: CompositionFrameCount) => {
    const { supported, rejectedCount } = partitionSupportedImages(files)
    if (!supported.length) {
      toast.warning(t('toast.noUsableImages'), {
        description: t('toast.chooseSupportedTypes')
      })
      return
    }

    const slots = Array.from({ length: slotCount }, (_, index) => index)
    const emptySlots = slots.filter((index) => !images.value[index])
    const occupiedSlots = slots.filter((index) => images.value[index])
    const targets = [...emptySlots, ...occupiedSlots]
    const selectedFiles = supported.slice(0, slotCount)
    await placeFiles(selectedFiles.map((file, index) => ({ index: targets[index] ?? index, file })))

    if (supported.length > selectedFiles.length) {
      const single = slotCount === 1
      toast.warning(t(single ? 'toast.firstOneAdded' : 'toast.firstTwoAdded'), {
        description: t(single ? 'toast.oneImageLimit' : 'toast.twoImageLimit')
      })
    } else if (rejectedCount) {
      toast.warning(t('toast.unsupportedIgnored', { count: rejectedCount }), {
        description: t('toast.supportedTypes')
      })
    }
  }

  const removeImage = (index: number) => {
    images.value[index]?.decoded.dispose()
    const next = [...images.value]
    next[index] = undefined
    images.value = next
  }

  const swapImages = () => {
    images.value = [images.value[1], images.value[0]]
  }

  const updateImageTransform = (index: number, transform: Partial<CompositionImageTransform>) => {
    const image = images.value[index]
    if (!image) return

    const next = [...images.value]
    next[index] = {
      ...image,
      transform: { ...image.transform, ...transform }
    }
    images.value = next
  }

  const resetImageTransform = (index: number) => {
    updateImageTransform(index, { scale: 1, offsetX: 0, offsetY: 0 })
  }

  onBeforeUnmount(() => {
    disposed = true
    decodeVersions.forEach((version, index) => {
      decodeVersions[index] = version + 1
    })
    images.value.forEach((entry) => entry?.decoded.dispose())
  })

  return {
    images,
    rendering,
    placeFile,
    placeDroppedFiles,
    removeImage,
    swapImages,
    updateImageTransform,
    resetImageTransform
  }
}
