import type { MaybeRefOrGetter } from 'vue'
import { toast } from 'vue-sonner'

import { getCompositionOutputGeometry } from '~/types/composition'
import type {
  CompositionGeometry,
  CompositionImage,
  CompositionSettings
} from '~/types/composition'
import { drawComposition, hasSupportedCanvasDimensions } from '~/utils/compositionCanvas'
import { canvasToBlob, downloadBlob } from '~/utils/download'
import { errorMessageKey } from '~/utils/errors'
import { createFilmGrainTiles, releaseFilmGrainTiles } from '~/utils/filmTexture'
import type { FilmGrainTiles } from '~/utils/filmTexture'

export const useCompositionCanvas = (
  images: MaybeRefOrGetter<Array<CompositionImage | undefined>>,
  geometry: MaybeRefOrGetter<CompositionGeometry>,
  settings: MaybeRefOrGetter<CompositionSettings>
) => {
  const { t, locale } = useI18n()
  const translateError = useTranslatedError()
  const canvas = ref<HTMLCanvasElement>()
  const exporting = ref(false)
  usePwaUpdateBlocker('composer-export', exporting)
  let animationFrame: number | undefined
  let grainTiles: FilmGrainTiles | undefined

  const drawCanvas = () => {
    const target = canvas.value
    if (!target) return
    const currentGeometry = toValue(geometry)
    const currentSettings = toValue(settings)
    const currentImages = toValue(images)
    const outputGeometry = getCompositionOutputGeometry(currentGeometry, currentSettings.sprocket)
    if (!hasSupportedCanvasDimensions(outputGeometry)) return

    target.width = outputGeometry.width
    target.height = outputGeometry.height
    const context = target.getContext('2d')
    if (!context) return

    if (currentSettings.filmTexture) grainTiles ??= createFilmGrainTiles()
    drawComposition(context, {
      geometry: currentGeometry,
      settings: currentSettings,
      images: currentImages,
      placeholderLabel: (index) => t('composition.frame', { number: `0${index + 1}` }),
      grainTiles
    })
  }

  const scheduleDraw = () => {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
    animationFrame = requestAnimationFrame(() => {
      animationFrame = undefined
      drawCanvas()
    })
  }

  const download = async () => {
    if (exporting.value) return
    const target = canvas.value
    const currentImages = toValue(images)
    const currentSettings = toValue(settings)
    if (!target || !currentImages.some(Boolean)) {
      toast.warning(t('toast.addPhotoFirst'))
      return
    }

    try {
      exporting.value = true
      const blob = await canvasToBlob(
        target,
        currentSettings.outputFormat,
        currentSettings.outputQuality
      )
      const extension = currentSettings.outputFormat === 'jpeg' ? 'jpg' : 'png'
      downloadBlob(blob, `film-x-layout.${extension}`)
      toast.success(t('toast.compositionGenerated'))
    } catch (error) {
      toast.error(t('toast.compositionFailed'), {
        description: translateError(
          errorMessageKey(error, 'errors.compositionFailed'),
          'errors.compositionFailed'
        )
      })
    } finally {
      exporting.value = false
    }
  }

  watch(() => {
    const currentSettings = toValue(settings)
    return [
      toValue(images),
      toValue(geometry),
      currentSettings.background,
      currentSettings.pattern,
      currentSettings.sprocket.enabled,
      currentSettings.sprocket.placement,
      currentSettings.sprocket.color,
      currentSettings.sprocket.width,
      currentSettings.sprocket.text,
      currentSettings.sprocket.textColor,
      currentSettings.filmTexture,
      currentSettings.fit,
      currentSettings.outputFormat,
      currentSettings.canvasSizeMode,
      locale.value
    ]
  }, scheduleDraw)

  onMounted(drawCanvas)
  onBeforeUnmount(() => {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
    if (grainTiles) releaseFilmGrainTiles(grainTiles)
    grainTiles = undefined
  })

  return { canvas, download }
}
