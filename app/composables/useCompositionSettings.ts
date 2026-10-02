import {
  COMPOSITION_FRAME_FORMATS,
  COMPOSITION_SPROCKET_TEXT_COLORS,
  getCompositionOutputGeometry,
  MAX_COMPOSITION_CANVAS_SIDE
} from '~/types/composition'
import type { ShallowRef } from 'vue'

import type {
  CompositionCanvasSizeAnchor,
  CompositionCanvasSizeMode,
  CompositionFrame,
  CompositionFrameCount,
  CompositionFrameFormat,
  CompositionGeometry,
  CompositionImage,
  CompositionSettings
} from '~/types/composition'

const CANVAS_WIDTH = 2400
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
    frameFormat: 'half',
    frameCount: 2,
    ratioMode: 'preset',
    ratio: 4 / 5,
    customRatioWidth: 4,
    customRatioHeight: 5,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: Math.round(CANVAS_WIDTH / (4 / 5)),
    canvasSizeAnchor: 'width',
    canvasSizeMode: 'auto',
    layoutDirection: COMPOSITION_FRAME_FORMATS.half.layoutDirection,
    background: '#E9E4DA',
    pattern: 'none',
    sprocket: {
      enabled: false,
      placement: 'top-bottom',
      color: 'background',
      width: 96,
      text: '',
      textColor: COMPOSITION_SPROCKET_TEXT_COLORS.amber
    },
    filmTexture: false,
    fit: 'cover',
    padding: { top: 112, right: 112, bottom: 112, left: 112 },
    gap: 48,
    outputFormat: 'jpeg',
    outputQuality: 0.92
  })

  // Slots beyond the current frame count keep their image but stay out of the layout.
  const activeImages = computed(() => images.value.slice(0, settings.value.frameCount))
  const frameFormatSpec = computed(() => COMPOSITION_FRAME_FORMATS[settings.value.frameFormat])

  const customRatio = computed(() => {
    const width = Number(settings.value.customRatioWidth)
    const height = Number(settings.value.customRatioHeight)
    return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? clampRatio(width / height)
      : 1
  })

  const selectedRatio = computed(() =>
    settings.value.ratioMode === 'custom' ? customRatio.value : settings.value.ratio
  )

  const commonFrameRatio = computed(() => {
    const loadedRatios = activeImages.value.flatMap((entry) =>
      entry ? [clampRatio(entry.decoded.width / entry.decoded.height)] : []
    )
    if (!loadedRatios.length) return frameFormatSpec.value.ratio
    return loadedRatios.reduce((sum, value) => sum + value, 0) / loadedRatios.length
  })

  const frameLongSide = computed(() => {
    const loadedLongSides = activeImages.value.flatMap((entry) =>
      entry ? [Math.max(entry.decoded.width, entry.decoded.height)] : []
    )
    return loadedLongSides.length ? Math.max(...loadedLongSides) : frameFormatSpec.value.longSide
  })

  const getFrameGrid = () => {
    const { frameCount, gap, layoutDirection } = settings.value
    const columns = layoutDirection === 'horizontal' ? frameCount : 1
    const rows = layoutDirection === 'horizontal' ? 1 : frameCount
    return { columns, rows, gapX: (columns - 1) * gap, gapY: (rows - 1) * gap }
  }

  const layoutFrames = (frameWidth: number, frameHeight: number): CompositionFrame[] => {
    const { frameCount, gap, layoutDirection, padding } = settings.value
    const horizontal = layoutDirection === 'horizontal'
    return Array.from({ length: frameCount }, (_, index) => ({
      x: padding.left + (horizontal ? index * (frameWidth + gap) : 0),
      y: padding.top + (horizontal ? 0 : index * (frameHeight + gap)),
      width: frameWidth,
      height: frameHeight
    }))
  }

  const geometryFromFrameSize = (frameWidth: number, frameHeight: number): CompositionGeometry => {
    const { top, right, bottom, left } = settings.value.padding
    const { columns, rows, gapX, gapY } = getFrameGrid()
    return {
      width: Math.max(1, Math.round(left + right + frameWidth * columns + gapX)),
      height: Math.max(1, Math.round(top + bottom + frameHeight * rows + gapY)),
      frames: layoutFrames(frameWidth, frameHeight)
    }
  }

  const calculateGeometry = (
    canvasSize: number,
    canvasSizeAnchor = settings.value.canvasSizeAnchor
  ): CompositionGeometry => {
    const { top, right, bottom, left } = settings.value.padding
    const { columns, rows, gapX, gapY } = getFrameGrid()

    if (settings.value.ratioMode === 'auto') {
      const frameWidth =
        canvasSizeAnchor === 'width'
          ? Math.max(1, (canvasSize - left - right - gapX) / columns)
          : Math.max(1, ((canvasSize - top - bottom - gapY) / rows) * commonFrameRatio.value)
      const frameHeight =
        canvasSizeAnchor === 'height'
          ? Math.max(1, (canvasSize - top - bottom - gapY) / rows)
          : Math.max(1, frameWidth / commonFrameRatio.value)
      return geometryFromFrameSize(frameWidth, frameHeight)
    }

    const width = Math.max(
      1,
      Math.round(canvasSizeAnchor === 'width' ? canvasSize : canvasSize * selectedRatio.value)
    )
    const height = Math.max(
      1,
      Math.round(canvasSizeAnchor === 'height' ? canvasSize : canvasSize / selectedRatio.value)
    )
    const frameWidth = Math.max(1, (width - left - right - gapX) / columns)
    const frameHeight = Math.max(1, (height - top - bottom - gapY) / rows)
    return { width, height, frames: layoutFrames(frameWidth, frameHeight) }
  }

  const calculateAutomaticGeometry = (longSide: number): CompositionGeometry => {
    const { top, right, bottom, left } = settings.value.padding
    const frameRatio = commonFrameRatio.value
    // Frame size that shows an image of this long side at its native pixel size.
    const nativeWidth = frameRatio >= 1 ? longSide : longSide * frameRatio
    const nativeHeight = frameRatio >= 1 ? longSide / frameRatio : longSide

    if (settings.value.ratioMode === 'auto') {
      return geometryFromFrameSize(nativeWidth, nativeHeight)
    }

    if (settings.value.frameCount === 1) {
      // Match one native image side to the frame, picking the side that keeps scale 1 for the fit.
      const widthBased = calculateGeometry(nativeWidth + left + right, 'width')
      const heightBased = calculateGeometry(nativeHeight + top + bottom, 'height')
      const widthBasedIsSmaller = widthBased.width <= heightBased.width
      return widthBasedIsSmaller === (settings.value.fit === 'cover') ? widthBased : heightBased
    }

    const canvasSizeAnchor: CompositionCanvasSizeAnchor =
      selectedRatio.value <= 1 ? 'width' : 'height'
    const padding = canvasSizeAnchor === 'width' ? left + right : top + bottom
    return calculateGeometry(longSide + padding, canvasSizeAnchor)
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

  const largestSafeAutomaticGeometry = () => {
    const requestedLongSide = frameLongSide.value
    const requestedGeometry = calculateAutomaticGeometry(requestedLongSide)
    if (isWithinCanvasLimit(requestedGeometry)) return requestedGeometry

    let minimum = 1
    let maximum = requestedLongSide
    let largestSafeLongSide = 1

    while (minimum <= maximum) {
      const candidate = Math.floor((minimum + maximum) / 2)
      if (isWithinCanvasLimit(calculateAutomaticGeometry(candidate))) {
        largestSafeLongSide = candidate
        minimum = candidate + 1
      } else {
        maximum = candidate - 1
      }
    }

    return calculateAutomaticGeometry(largestSafeLongSide)
  }

  const geometry = computed<CompositionGeometry>(() => {
    if (settings.value.canvasSizeMode === 'auto') return largestSafeAutomaticGeometry()

    const canvasSize =
      settings.value.canvasSizeAnchor === 'width'
        ? settings.value.canvasWidth
        : settings.value.canvasHeight
    return calculateGeometry(largestSafeCanvasSize(canvasSize))
  })

  const aspectStyle = computed(() => {
    const outputGeometry = getCompositionOutputGeometry(geometry.value, settings.value.sprocket)
    return { aspectRatio: `${outputGeometry.width} / ${outputGeometry.height}` }
  })

  const updateCanvasWidth = (value: number | string) => {
    const nextWidth = normalizeCanvasDimension(value)
    if (nextWidth === undefined) return
    settings.value.canvasSizeMode = 'manual'
    settings.value.canvasSizeAnchor = 'width'
    settings.value.canvasWidth = largestSafeCanvasSize(nextWidth)
  }

  const updateCanvasHeight = (value: number | string) => {
    const nextHeight = normalizeCanvasDimension(value)
    if (nextHeight === undefined) return
    settings.value.canvasSizeMode = 'manual'
    settings.value.canvasSizeAnchor = 'height'
    settings.value.canvasHeight = largestSafeCanvasSize(nextHeight)
  }

  const setCanvasSizeMode = (mode: CompositionCanvasSizeMode) => {
    if (mode === settings.value.canvasSizeMode) return

    if (mode === 'manual') {
      const automaticGeometry = largestSafeAutomaticGeometry()
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
