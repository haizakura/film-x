import type { MaybeRefOrGetter } from 'vue'
import { toast } from 'vue-sonner'

import {
  getCompositionOutputGeometry,
  MAX_COMPOSITION_CANVAS_SIDE,
  MAX_COMPOSITION_SPROCKET_WIDTH
} from '~/types/composition'
import type {
  CompositionGeometry,
  CompositionImage,
  CompositionSettings
} from '~/types/composition'
import { isLightColor } from '~/utils/color'
import { canvasToBlob, downloadBlob } from '~/utils/download'
import { errorMessageKey } from '~/utils/errors'
import { drawSprocketHoles, drawSprocketText } from '~/utils/filmSprocket'
import { createFilmGrainTiles, drawFilmGrain, releaseFilmGrainTiles } from '~/utils/filmTexture'
import type { FilmGrainTiles } from '~/utils/filmTexture'

const getSprocketBandColor = (settings: CompositionSettings) =>
  settings.sprocket.color === 'background' ? settings.background : '#000000'

const getSprocketHoleColor = (settings: CompositionSettings) =>
  settings.sprocket.color === 'background' ? '#000000' : '#ffffff'

const hasSupportedCanvasDimensions = (geometry: Pick<CompositionGeometry, 'width' | 'height'>) =>
  [geometry.width, geometry.height].every(
    (dimension) =>
      Number.isSafeInteger(dimension) &&
      dimension >= 1 &&
      dimension <= MAX_COMPOSITION_CANVAS_SIDE + MAX_COMPOSITION_SPROCKET_WIDTH * 2
  )

const drawPattern = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: CompositionSettings
) => {
  if (settings.pattern === 'none') return
  const foreground = isLightColor(settings.background)
    ? 'rgba(20,20,20,.09)'
    : 'rgba(255,255,255,.1)'
  context.save()
  context.strokeStyle = foreground
  context.fillStyle = foreground
  context.lineWidth = 2

  if (settings.pattern === 'grid') {
    const step = 64
    for (let x = 0; x <= width; x += step) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, height)
      context.stroke()
    }
    for (let y = 0; y <= height; y += step) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(width, y)
      context.stroke()
    }
  } else {
    const step = 52
    for (let x = step / 2; x < width; x += step) {
      for (let y = step / 2; y < height; y += step) {
        context.beginPath()
        context.arc(x, y, 3.2, 0, Math.PI * 2)
        context.fill()
      }
    }
  }
  context.restore()
}

const drawPlacedImage = (
  context: CanvasRenderingContext2D,
  image: CompositionImage,
  frame: CompositionGeometry['frames'][number],
  settings: CompositionSettings
) => {
  const scale =
    settings.fit === 'cover'
      ? Math.max(frame.width / image.decoded.width, frame.height / image.decoded.height)
      : Math.min(frame.width / image.decoded.width, frame.height / image.decoded.height)
  const transform =
    settings.canvasSizeMode === 'manual' ? image.transform : { scale: 1, offsetX: 0, offsetY: 0 }
  const renderWidth = image.decoded.width * scale * transform.scale
  const renderHeight = image.decoded.height * scale * transform.scale
  const renderX = frame.x + (frame.width - renderWidth) / 2 + transform.offsetX
  const renderY = frame.y + (frame.height - renderHeight) / 2 + transform.offsetY

  context.save()
  context.beginPath()
  context.rect(frame.x, frame.y, frame.width, frame.height)
  context.clip()
  context.drawImage(image.decoded.source, renderX, renderY, renderWidth, renderHeight)
  context.restore()
}

const drawPlaceholder = (
  context: CanvasRenderingContext2D,
  frame: CompositionGeometry['frames'][number],
  background: string,
  label: string
) => {
  const light = isLightColor(background)
  context.save()
  context.fillStyle = light ? 'rgba(255,255,255,.38)' : 'rgba(255,255,255,.04)'
  context.strokeStyle = light ? 'rgba(20,20,20,.22)' : 'rgba(255,255,255,.2)'
  context.lineWidth = 3
  context.setLineDash([18, 15])
  context.fillRect(frame.x, frame.y, frame.width, frame.height)
  context.strokeRect(frame.x, frame.y, frame.width, frame.height)
  context.fillStyle = light ? 'rgba(20,20,20,.5)' : 'rgba(255,255,255,.55)'
  context.font = '500 28px SFMono-Regular, monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(label, frame.x + frame.width / 2, frame.y + frame.height / 2)
  context.restore()
}

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

    if (currentSettings.sprocket.enabled) {
      context.fillStyle = getSprocketBandColor(currentSettings)
      context.fillRect(0, 0, outputGeometry.width, outputGeometry.height)
      drawSprocketText(context, outputGeometry, currentSettings.sprocket)
    }

    context.save()
    context.translate(outputGeometry.contentOffsetX, outputGeometry.contentOffsetY)
    context.fillStyle = currentSettings.background
    context.fillRect(0, 0, currentGeometry.width, currentGeometry.height)
    drawPattern(context, currentGeometry.width, currentGeometry.height, currentSettings)
    context.restore()

    if (currentSettings.filmTexture) {
      grainTiles ??= createFilmGrainTiles()
      if (grainTiles) {
        drawFilmGrain(context, grainTiles, outputGeometry.width, outputGeometry.height)
      }
    }

    context.save()
    context.translate(outputGeometry.contentOffsetX, outputGeometry.contentOffsetY)
    currentImages.forEach((entry, index) => {
      const frame = currentGeometry.frames[index]
      if (!frame) return
      context.save()
      context.shadowColor = 'rgba(0,0,0,.18)'
      context.shadowBlur = 30
      context.shadowOffsetY = 12
      if (entry) drawPlacedImage(context, entry, frame, currentSettings)
      else {
        drawPlaceholder(
          context,
          frame,
          currentSettings.background,
          t('composition.frame', { number: `0${index + 1}` })
        )
      }
      context.restore()
    })
    context.restore()

    if (currentSettings.sprocket.enabled) {
      drawSprocketHoles(context, outputGeometry, currentSettings.sprocket, {
        holeColor: getSprocketHoleColor(currentSettings),
        transparent: currentSettings.outputFormat === 'png',
        textured: currentSettings.filmTexture
      })
    }
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
