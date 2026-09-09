import { MAX_COMPOSITION_CANVAS_SIDE } from '~/types/composition'
import type { ShallowRef } from 'vue'

import type {
  CompositionGeometry,
  CompositionImage,
  CompositionSettings
} from '~/types/composition'

const CANVAS_WIDTH = 2400
const DEFAULT_FRAME_RATIO = 2 / 3
const MIN_RATIO = 0.2
const MAX_RATIO = 5

const clampRatio = (value: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, value))

const normalizeCanvasDimension = (value: number | string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 1
    ? Math.min(MAX_COMPOSITION_CANVAS_SIDE, Math.round(parsed))
    : undefined
}

export const useCompositionSettings = (images: ShallowRef<Array<CompositionImage | undefined>>) => {
  const settings = ref<CompositionSettings>({
    ratioMode: 'preset',
    ratio: 4 / 5,
    customRatioWidth: 4,
    customRatioHeight: 5,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: Math.round(CANVAS_WIDTH / (4 / 5)),
    canvasSizeAnchor: 'width',
    layoutDirection: 'horizontal',
    background: '#E9E4DA',
    pattern: 'none',
    fit: 'cover',
    padding: { top: 112, right: 112, bottom: 112, left: 112 },
    gap: 48,
    outputFormat: 'jpeg',
    outputQuality: 0.92
  })

  const customRatio = computed(() => {
    const width = Number(settings.value.customRatioWidth)
    const height = Number(settings.value.customRatioHeight)
    return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? clampRatio(width / height)
      : 1
  })

  const commonFrameRatio = computed(() => {
    const loadedRatios = images.value.flatMap((entry) =>
      entry ? [clampRatio(entry.decoded.width / entry.decoded.height)] : []
    )
    if (!loadedRatios.length) return DEFAULT_FRAME_RATIO
    return loadedRatios.reduce((sum, value) => sum + value, 0) / loadedRatios.length
  })

  const calculateGeometry = (canvasSize: number): CompositionGeometry => {
    const { top, right, bottom, left } = settings.value.padding
    const { canvasSizeAnchor, gap, layoutDirection, ratioMode } = settings.value
    const horizontal = layoutDirection === 'horizontal'

    if (ratioMode === 'auto') {
      const frameWidth =
        canvasSizeAnchor === 'width'
          ? Math.max(1, (canvasSize - left - right - (horizontal ? gap : 0)) / (horizontal ? 2 : 1))
          : Math.max(
              1,
              ((canvasSize - top - bottom - (horizontal ? 0 : gap)) / (horizontal ? 1 : 2)) *
                commonFrameRatio.value
            )
      const frameHeight =
        canvasSizeAnchor === 'height'
          ? Math.max(1, (canvasSize - top - bottom - (horizontal ? 0 : gap)) / (horizontal ? 1 : 2))
          : Math.max(1, frameWidth / commonFrameRatio.value)
      const width = Math.max(
        1,
        Math.round(horizontal ? left + right + frameWidth * 2 + gap : left + right + frameWidth)
      )
      const height = Math.max(
        1,
        Math.round(horizontal ? top + bottom + frameHeight : top + bottom + frameHeight * 2 + gap)
      )
      const frames = [0, 1].map((index) => ({
        x: horizontal ? left + index * (frameWidth + gap) : left,
        y: horizontal ? top : top + index * (frameHeight + gap),
        width: frameWidth,
        height: frameHeight
      }))
      return { width, height, frames }
    }

    const selectedRatio = ratioMode === 'custom' ? customRatio.value : settings.value.ratio
    const width = Math.max(
      1,
      Math.round(canvasSizeAnchor === 'width' ? canvasSize : canvasSize * selectedRatio)
    )
    const height = Math.max(
      1,
      Math.round(canvasSizeAnchor === 'height' ? canvasSize : canvasSize / selectedRatio)
    )
    const frameWidth = horizontal
      ? Math.max(1, (width - left - right - gap) / 2)
      : Math.max(1, width - left - right)
    const frameHeight = horizontal
      ? Math.max(1, height - top - bottom)
      : Math.max(1, (height - top - bottom - gap) / 2)
    const frames = [0, 1].map((index) => ({
      x: horizontal ? left + index * (frameWidth + gap) : left,
      y: horizontal ? top : top + index * (frameHeight + gap),
      width: frameWidth,
      height: frameHeight
    }))
    return { width, height, frames }
  }

  const isWithinCanvasLimit = (geometry: CompositionGeometry) =>
    Math.max(geometry.width, geometry.height) <= MAX_COMPOSITION_CANVAS_SIDE

  const largestSafeCanvasSize = (requestedSize: number) => {
    if (isWithinCanvasLimit(calculateGeometry(requestedSize))) return requestedSize

    let minimum = 1
    let maximum = requestedSize
    let largestSafeSize = 1

    while (minimum <= maximum) {
      const candidate = Math.floor((minimum + maximum) / 2)
      if (isWithinCanvasLimit(calculateGeometry(candidate))) {
        largestSafeSize = candidate
        minimum = candidate + 1
      } else {
        maximum = candidate - 1
      }
    }

    return largestSafeSize
  }

  const geometry = computed<CompositionGeometry>(() => {
    const canvasSize =
      settings.value.canvasSizeAnchor === 'width'
        ? settings.value.canvasWidth
        : settings.value.canvasHeight
    return calculateGeometry(largestSafeCanvasSize(canvasSize))
  })

  const aspectStyle = computed(() => ({
    aspectRatio: `${geometry.value.width} / ${geometry.value.height}`
  }))

  const updateCanvasWidth = (value: number | string) => {
    const nextWidth = normalizeCanvasDimension(value)
    if (nextWidth === undefined) return
    settings.value.canvasSizeAnchor = 'width'
    settings.value.canvasWidth = largestSafeCanvasSize(nextWidth)
  }

  const updateCanvasHeight = (value: number | string) => {
    const nextHeight = normalizeCanvasDimension(value)
    if (nextHeight === undefined) return
    settings.value.canvasSizeAnchor = 'height'
    settings.value.canvasHeight = largestSafeCanvasSize(nextHeight)
  }

  return { settings, geometry, aspectStyle, updateCanvasWidth, updateCanvasHeight }
}
