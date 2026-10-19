import { clampCanvasRatio, getCustomCanvasRatio } from '~/types/canvas'
import { COMPOSITION_FRAME_FORMATS, MAX_COMPOSITION_CANVAS_SIDE } from '~/types/composition'
import type {
  CompositionCanvasSizeAnchor,
  CompositionFrame,
  CompositionGeometry,
  CompositionSettings
} from '~/types/composition'

export interface CompositionImageSize {
  width: number
  height: number
}

type CompositionImageSizes = ReadonlyArray<CompositionImageSize | undefined>

/** Everything the geometry chain derives from the settings and the loaded images. */
interface GeometryContext {
  settings: CompositionSettings
  commonFrameRatio: number
  frameLongSide: number
  selectedRatio: number
}

// Slots beyond the current frame count keep their image but stay out of the layout.
const createContext = (
  settings: CompositionSettings,
  images: CompositionImageSizes
): GeometryContext => {
  const frameFormatSpec = COMPOSITION_FRAME_FORMATS[settings.frameFormat]
  const activeImages = images.slice(0, settings.frameCount)

  const loadedRatios = activeImages.flatMap((entry) =>
    entry ? [clampCanvasRatio(entry.width / entry.height)] : []
  )
  const commonFrameRatio = loadedRatios.length
    ? loadedRatios.reduce((sum, value) => sum + value, 0) / loadedRatios.length
    : frameFormatSpec.ratio

  const loadedLongSides = activeImages.flatMap((entry) =>
    entry ? [Math.max(entry.width, entry.height)] : []
  )
  const frameLongSide = loadedLongSides.length
    ? Math.max(...loadedLongSides)
    : frameFormatSpec.longSide

  const customRatio = getCustomCanvasRatio(settings.customRatioWidth, settings.customRatioHeight)
  const selectedRatio = settings.ratioMode === 'custom' ? customRatio : settings.ratio

  return { settings, commonFrameRatio, frameLongSide, selectedRatio }
}

const getFrameGrid = ({ settings }: GeometryContext) => {
  const { frameCount, gap, layoutDirection } = settings
  const columns = layoutDirection === 'horizontal' ? frameCount : 1
  const rows = layoutDirection === 'horizontal' ? 1 : frameCount
  return { columns, rows, gapX: (columns - 1) * gap, gapY: (rows - 1) * gap }
}

const layoutFrames = (
  { settings }: GeometryContext,
  frameWidth: number,
  frameHeight: number
): CompositionFrame[] => {
  const { frameCount, gap, layoutDirection, padding } = settings
  const horizontal = layoutDirection === 'horizontal'
  return Array.from({ length: frameCount }, (_, index) => ({
    x: padding.left + (horizontal ? index * (frameWidth + gap) : 0),
    y: padding.top + (horizontal ? 0 : index * (frameHeight + gap)),
    width: frameWidth,
    height: frameHeight
  }))
}

const geometryFromFrameSize = (
  context: GeometryContext,
  frameWidth: number,
  frameHeight: number
): CompositionGeometry => {
  const { top, right, bottom, left } = context.settings.padding
  const { columns, rows, gapX, gapY } = getFrameGrid(context)
  return {
    width: Math.max(1, Math.round(left + right + frameWidth * columns + gapX)),
    height: Math.max(1, Math.round(top + bottom + frameHeight * rows + gapY)),
    frames: layoutFrames(context, frameWidth, frameHeight)
  }
}

const calculateGeometry = (
  context: GeometryContext,
  canvasSize: number,
  canvasSizeAnchor = context.settings.canvasSizeAnchor
): CompositionGeometry => {
  const { settings, commonFrameRatio, selectedRatio } = context
  const { top, right, bottom, left } = settings.padding
  const { columns, rows, gapX, gapY } = getFrameGrid(context)

  if (settings.ratioMode === 'auto') {
    const frameWidth =
      canvasSizeAnchor === 'width'
        ? Math.max(1, (canvasSize - left - right - gapX) / columns)
        : Math.max(1, ((canvasSize - top - bottom - gapY) / rows) * commonFrameRatio)
    const frameHeight =
      canvasSizeAnchor === 'height'
        ? Math.max(1, (canvasSize - top - bottom - gapY) / rows)
        : Math.max(1, frameWidth / commonFrameRatio)
    return geometryFromFrameSize(context, frameWidth, frameHeight)
  }

  const width = Math.max(
    1,
    Math.round(canvasSizeAnchor === 'width' ? canvasSize : canvasSize * selectedRatio)
  )
  const height = Math.max(
    1,
    Math.round(canvasSizeAnchor === 'height' ? canvasSize : canvasSize / selectedRatio)
  )
  const frameWidth = Math.max(1, (width - left - right - gapX) / columns)
  const frameHeight = Math.max(1, (height - top - bottom - gapY) / rows)
  return { width, height, frames: layoutFrames(context, frameWidth, frameHeight) }
}

const calculateAutomaticGeometry = (
  context: GeometryContext,
  longSide: number
): CompositionGeometry => {
  const { settings, commonFrameRatio: frameRatio, selectedRatio } = context
  const { top, right, bottom, left } = settings.padding
  // Frame size that shows an image of this long side at its native pixel size.
  const nativeWidth = frameRatio >= 1 ? longSide : longSide * frameRatio
  const nativeHeight = frameRatio >= 1 ? longSide / frameRatio : longSide

  if (settings.ratioMode === 'auto') {
    return geometryFromFrameSize(context, nativeWidth, nativeHeight)
  }

  if (settings.frameCount === 1) {
    // Match one native image side to the frame, picking the side that keeps scale 1 for the fit.
    const widthBased = calculateGeometry(context, nativeWidth + left + right, 'width')
    const heightBased = calculateGeometry(context, nativeHeight + top + bottom, 'height')
    const widthBasedIsSmaller = widthBased.width <= heightBased.width
    return widthBasedIsSmaller === (settings.fit === 'cover') ? widthBased : heightBased
  }

  const canvasSizeAnchor: CompositionCanvasSizeAnchor = selectedRatio <= 1 ? 'width' : 'height'
  const padding = canvasSizeAnchor === 'width' ? left + right : top + bottom
  return calculateGeometry(context, longSide + padding, canvasSizeAnchor)
}

const isWithinCanvasLimit = (geometry: CompositionGeometry) =>
  Math.max(geometry.width, geometry.height) <= MAX_COMPOSITION_CANVAS_SIDE

const largestSafeCanvasSize = (context: GeometryContext, requestedSize: number) => {
  if (isWithinCanvasLimit(calculateGeometry(context, requestedSize))) return requestedSize

  let minimum = 1
  let maximum = requestedSize
  let largestSafeSize = 1

  while (minimum <= maximum) {
    const candidate = Math.floor((minimum + maximum) / 2)
    if (isWithinCanvasLimit(calculateGeometry(context, candidate))) {
      largestSafeSize = candidate
      minimum = candidate + 1
    } else {
      maximum = candidate - 1
    }
  }

  return largestSafeSize
}

const largestSafeAutomaticGeometry = (context: GeometryContext) => {
  const requestedLongSide = context.frameLongSide
  const requestedGeometry = calculateAutomaticGeometry(context, requestedLongSide)
  if (isWithinCanvasLimit(requestedGeometry)) return requestedGeometry

  let minimum = 1
  let maximum = requestedLongSide
  let largestSafeLongSide = 1

  while (minimum <= maximum) {
    const candidate = Math.floor((minimum + maximum) / 2)
    if (isWithinCanvasLimit(calculateAutomaticGeometry(context, candidate))) {
      largestSafeLongSide = candidate
      minimum = candidate + 1
    } else {
      maximum = candidate - 1
    }
  }

  return calculateAutomaticGeometry(context, largestSafeLongSide)
}

/** Automatic mode follows the images; manual mode uses the requested canvas side. */
export const getCompositionGeometry = (
  settings: CompositionSettings,
  images: CompositionImageSizes
): CompositionGeometry => {
  const context = createContext(settings, images)
  if (settings.canvasSizeMode === 'auto') return largestSafeAutomaticGeometry(context)

  const canvasSize =
    settings.canvasSizeAnchor === 'width' ? settings.canvasWidth : settings.canvasHeight
  return calculateGeometry(context, largestSafeCanvasSize(context, canvasSize))
}

/** Largest geometry that shows the images at native size within the canvas limit. */
export const getAutomaticCompositionGeometry = (
  settings: CompositionSettings,
  images: CompositionImageSizes
): CompositionGeometry => largestSafeAutomaticGeometry(createContext(settings, images))

/** Largest canvas side, up to the requested one, whose geometry stays within the limit. */
export const getLargestSafeCanvasSize = (
  settings: CompositionSettings,
  images: CompositionImageSizes,
  requestedSize: number
) => largestSafeCanvasSize(createContext(settings, images), requestedSize)
