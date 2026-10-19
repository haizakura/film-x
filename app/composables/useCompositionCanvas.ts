import type { MaybeRefOrGetter } from 'vue'
import { toast } from 'vue-sonner'

import { COMPOSITION_PREVIEW_SIDE, getCompositionOutputGeometry } from '~/types/composition'
import type {
  CompositionGeometry,
  CompositionImage,
  CompositionSettings
} from '~/types/composition'
import { drawComposition, hasSupportedCanvasDimensions } from '~/utils/compositionCanvas'
import { canvasToBlob, downloadBlob, releaseCanvas } from '~/utils/download'
import { AppError, errorMessageKey } from '~/utils/errors'
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

  const getOutputGeometry = () =>
    getCompositionOutputGeometry(toValue(geometry), toValue(settings).sprocket)

  /** Draws in output pixels; the caller scales the context for a smaller canvas. */
  const render = (context: CanvasRenderingContext2D) => {
    const currentSettings = toValue(settings)
    if (currentSettings.filmTexture) grainTiles ??= createFilmGrainTiles()
    drawComposition(context, {
      geometry: toValue(geometry),
      settings: currentSettings,
      images: toValue(images),
      placeholderLabel: (index) => t('composition.frame', { number: `0${index + 1}` }),
      grainTiles
    })
  }

  const drawCanvas = () => {
    const target = canvas.value
    if (!target) return
    const outputGeometry = getOutputGeometry()
    if (!hasSupportedCanvasDimensions(outputGeometry)) return

    const scale = Math.min(
      1,
      COMPOSITION_PREVIEW_SIDE / Math.max(outputGeometry.width, outputGeometry.height)
    )
    const width = Math.max(1, Math.round(outputGeometry.width * scale))
    const height = Math.max(1, Math.round(outputGeometry.height * scale))
    // Assigning a size, even the same one, reallocates the backing store.
    if (target.width !== width || target.height !== height) {
      target.width = width
      target.height = height
    }
    const context = target.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, width, height)
    context.save()
    context.scale(width / outputGeometry.width, height / outputGeometry.height)
    context.imageSmoothingQuality = 'high'
    render(context)
    context.restore()
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
    if (!toValue(images).some(Boolean)) {
      toast.warning(t('toast.addPhotoFirst'))
      return
    }

    let output: HTMLCanvasElement | undefined
    try {
      exporting.value = true
      const currentSettings = toValue(settings)
      const outputGeometry = getOutputGeometry()
      if (!hasSupportedCanvasDimensions(outputGeometry)) {
        throw new AppError('exportCanvasUnavailable')
      }
      output = document.createElement('canvas')
      output.width = outputGeometry.width
      output.height = outputGeometry.height
      const context = output.getContext('2d')
      if (!context) throw new AppError('exportCanvasUnavailable')
      render(context)
      const blob = await canvasToBlob(
        output,
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
      if (output) releaseCanvas(output)
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
