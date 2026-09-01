import type { MaybeRefOrGetter } from 'vue'
import { toast } from 'vue-sonner'

import type {
  CompositionGeometry,
  CompositionImage,
  CompositionSettings
} from '~/types/composition'
import { canvasToBlob, downloadBlob } from '~/utils/download'

const isLightColor = (hex: string) => {
  const value = hex.replace('#', '')
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return red * 0.299 + green * 0.587 + blue * 0.114 > 145
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
  image: CompositionImage['decoded'],
  frame: CompositionGeometry['frames'][number],
  settings: CompositionSettings
) => {
  const scale =
    settings.fit === 'cover'
      ? Math.max(frame.width / image.width, frame.height / image.height)
      : Math.min(frame.width / image.width, frame.height / image.height)
  const renderWidth = image.width * scale
  const renderHeight = image.height * scale
  const renderX = frame.x + (frame.width - renderWidth) / 2
  const renderY = frame.y + (frame.height - renderHeight) / 2

  context.save()
  context.beginPath()
  context.rect(frame.x, frame.y, frame.width, frame.height)
  context.clip()
  context.drawImage(image.source, renderX, renderY, renderWidth, renderHeight)
  context.restore()
}

const drawPlaceholder = (
  context: CanvasRenderingContext2D,
  frame: CompositionGeometry['frames'][number],
  index: number,
  background: string
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
  context.fillText(`FRAME 0${index + 1}`, frame.x + frame.width / 2, frame.y + frame.height / 2)
  context.restore()
}

export const useCompositionCanvas = (
  images: MaybeRefOrGetter<Array<CompositionImage | undefined>>,
  geometry: MaybeRefOrGetter<CompositionGeometry>,
  settings: MaybeRefOrGetter<CompositionSettings>
) => {
  const canvas = ref<HTMLCanvasElement>()
  let animationFrame: number | undefined

  const drawCanvas = () => {
    const target = canvas.value
    if (!target) return
    const currentGeometry = toValue(geometry)
    const currentSettings = toValue(settings)
    const currentImages = toValue(images)

    target.width = currentGeometry.width
    target.height = currentGeometry.height
    const context = target.getContext('2d')
    if (!context) return

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
      if (entry) drawPlacedImage(context, entry.decoded, frame, currentSettings)
      else drawPlaceholder(context, frame, index, currentSettings.background)
      context.restore()
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
    const target = canvas.value
    const currentImages = toValue(images)
    const currentSettings = toValue(settings)
    if (!target || !currentImages.some(Boolean)) {
      toast.warning('请先加入照片')
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
      toast.success('排版图像已生成')
    } catch (error) {
      toast.error('生成失败', {
        description: error instanceof Error ? error.message : '无法生成排版图像'
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
      currentSettings.fit
    ]
  }, scheduleDraw)

  onMounted(drawCanvas)
  onBeforeUnmount(() => {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
  })

  return { canvas, download }
}
