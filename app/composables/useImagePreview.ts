import type { ComputedRef } from 'vue'

import type { DecodedImage, ImageQueueItem } from '~/types/image'
import { decodeImage } from '~/utils/image'

interface ImagePreviewOptions {
  onError?: (item: ImageQueueItem, message: string) => void
  onDecoded?: (item: ImageQueueItem, image: DecodedImage) => void
}

export const useImagePreview = (
  activeItem: ComputedRef<ImageQueueItem | undefined>,
  options: ImagePreviewOptions = {}
) => {
  const decoded = shallowRef<DecodedImage>()
  const isLoading = ref(false)
  let decodeToken = 0

  const loadActiveImage = async () => {
    const item = activeItem.value
    const token = ++decodeToken
    decoded.value?.dispose()
    decoded.value = undefined

    if (!item) {
      isLoading.value = false
      return
    }

    isLoading.value = true
    try {
      const image = await decodeImage(item.file)
      if (token !== decodeToken) {
        image.dispose()
        return
      }

      decoded.value = image
      item.error = undefined
      options.onDecoded?.(item, image)
    } catch (error) {
      const message = error instanceof Error ? error.message : '无法读取图像'
      item.status = 'error'
      item.error = message
      options.onError?.(item, message)
    } finally {
      if (token === decodeToken) isLoading.value = false
    }
  }

  watch(() => activeItem.value?.id, loadActiveImage, { immediate: true })
  onBeforeUnmount(() => {
    decodeToken += 1
    decoded.value?.dispose()
  })

  return { decoded, isLoading, reload: loadActiveImage }
}
