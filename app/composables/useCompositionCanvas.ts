import type { MaybeRefOrGetter } from 'vue'
import { toast } from 'vue-sonner'

import {
  getCompositionOutputGeometry,
  MAX_COMPOSITION_CANVAS_SIDE,
  MAX_COMPOSITION_SPROCKET_WIDTH,
  MIN_COMPOSITION_SPROCKET_WIDTH
} from '~/types/composition'
import type {
  CompositionGeometry,
  CompositionImage,
  CompositionSettings
} from '~/types/composition'
import { canvasToBlob, downloadBlob } from '~/utils/download'
import { errorMessageKey } from '~/utils/errors'

const isLightColor = (hex: string) => {
  const value = hex.replace('#', '')
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return red * 0.299 + green * 0.587 + blue * 0.114 > 145
}

const getSprocketBandColor = (settings: CompositionSettings) =>
  settings.sprocket.color === 'background' ? settings.background : '#000000'

const getSprocketJpegHoleColor = (settings: CompositionSettings) =>
  settings.sprocket.color === 'background' ? '#000000' : '#ffffff'

const hasSupportedCanvasDimensions = (geometry: Pick<CompositionGeometry, 'width' | 'height'>) =>
  [geometry.width, geometry.height].every(
    (dimension) =>
      Number.isSafeInteger(dimension) &&
      dimension >= 1 &&
      dimension <= MAX_COMPOSITION_CANVAS_SIDE + MAX_COMPOSITION_SPROCKET_WIDTH * 2
  )

const drawSprocketHoles = (
  context: CanvasRenderingContext2D,
  output: ReturnType<typeof getCompositionOutputGeometry>,
  settings: CompositionSettings
) => {
  if (!settings.sprocket.enabled) return

  const { placement } = settings.sprocket
  const bandWidth = Math.min(
    MAX_COMPOSITION_SPROCKET_WIDTH,
    Math.max(MIN_COMPOSITION_SPROCKET_WIDTH, Math.round(settings.sprocket.width))
  )
  const longSide = placement === 'top-bottom' ? output.width : output.height
  const holeLength = Math.min(80, Math.max(18, Math.round(bandWidth * 0.62)))
  const holeThickness = Math.max(12, Math.round(bandWidth * 0.54))
  const pitch = Math.max(holeLength + 20, Math.round(bandWidth * 1.8))
  const initialOffset = (longSide % pitch) / 2
  const crossOffset = (bandWidth - holeThickness) / 2

  context.save()
  if (settings.outputFormat === 'png') {
    context.fillStyle = '#000000'
    context.globalCompositeOperation = 'destination-out'
  } else {
    context.fillStyle = getSprocketJpegHoleColor(settings)
  }
  for (let offset = initialOffset; offset < longSide; offset += pitch) {
    const length = Math.min(holeLength, longSide - offset)
    context.beginPath()
    if (placement === 'top-bottom') {
      context.roundRect(offset, crossOffset, length, holeThickness, Math.min(8, holeThickness / 4))
      context.roundRect(
        offset,
        output.height - bandWidth + crossOffset,
        length,
        holeThickness,
        Math.min(8, holeThickness / 4)
      )
    } else {
      context.roundRect(crossOffset, offset, holeThickness, length, Math.min(8, holeThickness / 4))
      context.roundRect(
        output.width - bandWidth + crossOffset,
        offset,
        holeThickness,
        length,
        Math.min(8, holeThickness / 4)
      )
    }
    context.fill()
  }
  context.restore()
}

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
  let animationFrame: number | undefined

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
    }

    context.save()
    context.translate(outputGeometry.contentOffsetX, outputGeometry.contentOffsetY)
    context.fillStyle = currentSettings.background
    context.fillRect(0, 0, currentGeometry.width, currentGeometry.height)
    drawPattern(context, currentGeometry.width, currentGeometry.height, currentSettings)

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
    drawSprocketHoles(context, outputGeometry, currentSettings)
  }

  const scheduleDraw = () => {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
    animationFrame = requestAnimationFrame(() => {
      animationFrame = undefined
      drawCanvas()
    })
  }

  const download = async () => {
    const target = canvas.value
    const currentImages = toValue(images)
    const currentSettings = toValue(settings)
    if (!target || !currentImages.some(Boolean)) {
      toast.warning(t('toast.addPhotoFirst'))
      return
    }

    try {
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
      currentSettings.fit,
      currentSettings.outputFormat,
      currentSettings.canvasSizeMode,
      locale.value
    ]
  }, scheduleDraw)

  onMounted(drawCanvas)
  onBeforeUnmount(() => {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
  })

  return { canvas, download }
}
