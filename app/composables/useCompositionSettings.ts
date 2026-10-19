import type { ShallowRef } from 'vue'

import {
  COMPOSITION_FRAME_FORMATS,
  getCompositionOutputGeometry,
  MAX_COMPOSITION_CANVAS_SIDE
} from '~/types/composition'
import type {
  CompositionCanvasSizeMode,
  CompositionFrameCount,
  CompositionFrameFormat,
  CompositionGeometry,
  CompositionImage,
  CompositionSettings
} from '~/types/composition'
import {
  getAutomaticCompositionGeometry,
  getCompositionGeometry,
  getLargestSafeCanvasSize
} from '~/utils/compositionGeometry'
import { createDefaultCompositionSettings } from '~/utils/compositionSettings'

const normalizeCanvasDimension = (value: number | string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 1
    ? Math.min(MAX_COMPOSITION_CANVAS_SIDE, Math.round(parsed))
    : undefined
}

export const useCompositionSettings = (images: ShallowRef<Array<CompositionImage | undefined>>) => {
  const settings = ref<CompositionSettings>(createDefaultCompositionSettings())

  // Slots beyond the current frame count keep their image but stay out of the layout.
  const activeImages = computed(() => images.value.slice(0, settings.value.frameCount))
  const imageSizes = () => images.value.map((entry) => entry?.decoded)

  const geometry = computed<CompositionGeometry>(() =>
    getCompositionGeometry(settings.value, imageSizes())
  )

  const aspectStyle = computed(() => {
    const outputGeometry = getCompositionOutputGeometry(geometry.value, settings.value.sprocket)
    return { aspectRatio: `${outputGeometry.width} / ${outputGeometry.height}` }
  })

  const updateCanvasWidth = (value: number | string) => {
    const nextWidth = normalizeCanvasDimension(value)
    if (nextWidth === undefined) return
    settings.value.canvasSizeMode = 'manual'
    settings.value.canvasSizeAnchor = 'width'
    settings.value.canvasWidth = getLargestSafeCanvasSize(settings.value, imageSizes(), nextWidth)
  }

  const updateCanvasHeight = (value: number | string) => {
    const nextHeight = normalizeCanvasDimension(value)
    if (nextHeight === undefined) return
    settings.value.canvasSizeMode = 'manual'
    settings.value.canvasSizeAnchor = 'height'
    settings.value.canvasHeight = getLargestSafeCanvasSize(settings.value, imageSizes(), nextHeight)
  }

  const setCanvasSizeMode = (mode: CompositionCanvasSizeMode) => {
    if (mode === settings.value.canvasSizeMode) return

    if (mode === 'manual') {
      const automaticGeometry = getAutomaticCompositionGeometry(settings.value, imageSizes())
      settings.value.canvasWidth = automaticGeometry.width
      settings.value.canvasHeight = automaticGeometry.height
      settings.value.canvasSizeAnchor =
        automaticGeometry.width <= automaticGeometry.height ? 'width' : 'height'
    }

    settings.value.canvasSizeMode = mode
  }

  const setFrameFormat = (format: CompositionFrameFormat) => {
    if (format === settings.value.frameFormat) return
    settings.value.frameFormat = format
    settings.value.layoutDirection = COMPOSITION_FRAME_FORMATS[format].layoutDirection
  }

  const setFrameCount = (count: CompositionFrameCount) => {
    settings.value.frameCount = count
  }

  return {
    settings,
    activeImages,
    geometry,
    aspectStyle,
    updateCanvasWidth,
    updateCanvasHeight,
    setCanvasSizeMode,
    setFrameFormat,
    setFrameCount
  }
}
