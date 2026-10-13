import { toast } from 'vue-sonner'
import type { FramePhoto } from '~/types/frame'
import { errorMessageKey } from '~/utils/errors'
import { readPhotoExif } from '~/utils/exif'
import type { PhotoExif } from '~/utils/exif'
import { decodeImage, partitionSupportedImages } from '~/utils/image'

export interface FrameImageEntry extends FramePhoto {
  exif?: PhotoExif
}

/** One image slot with decode versioning, used for the photo and for a custom logo. */
export const useFrameImage = (blockerKey: string, options: { readExif?: boolean } = {}) => {
  const { t } = useI18n()
  const translateError = useTranslatedError()
  const image = shallowRef<FrameImageEntry>()
  const loading = ref(false)
  usePwaUpdateBlocker(blockerKey, () => Boolean(image.value) || loading.value)
  let version = 0
  let disposed = false

  const placeFiles = async (files: File[]) => {
    const { supported, rejectedCount } = partitionSupportedImages(files)
    const file = supported[0]
    if (!file) {
      toast.warning(t('toast.unsupportedFile'), {
        description: t('toast.chooseSupportedTypes')
      })
      return
    }
    if (supported.length > 1) {
      toast.warning(t('toast.firstOneAdded'), { description: t('frame.toast.singleImage') })
    } else if (rejectedCount) {
      toast.warning(t('toast.unsupportedIgnored', { count: rejectedCount }), {
        description: t('toast.supportedTypes')
      })
    }

    version += 1
    const current = version
    loading.value = true
    try {
      // EXIF reads only small slices, so it runs before the serial full decode.
      const exif = options.readExif ? await readPhotoExif(file) : undefined
      // Skip the expensive decode when a newer file already replaced this one.
      if (disposed || current !== version) return
      const decoded = await decodeImage(file)
      if (disposed || current !== version) {
        decoded.dispose()
        return
      }
      image.value?.decoded.dispose()
      image.value = { name: file.name, decoded, exif }
    } catch (error) {
      if (!disposed && current === version) {
        toast.error(t('toast.readFailed', { name: file.name }), {
          description: translateError(
            errorMessageKey(error, 'errors.decodeFailed'),
            'errors.decodeFailed'
          )
        })
      }
    } finally {
      if (current === version) loading.value = false
    }
  }

  const clear = () => {
    version += 1
    image.value?.decoded.dispose()
    image.value = undefined
    loading.value = false
  }

  onBeforeUnmount(() => {
    disposed = true
    version += 1
    image.value?.decoded.dispose()
  })

  return { image, loading, placeFiles, clear }
}
