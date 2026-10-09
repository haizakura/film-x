import type { DecodedImage } from '~/types/image'

export const MAX_COMPOSITION_CANVAS_SIDE = 8000
export const MAX_COMPOSITION_FRAMES = 2
export const MIN_COMPOSITION_SPROCKET_WIDTH = 24
export const MAX_COMPOSITION_SPROCKET_WIDTH = 240
export const MAX_COMPOSITION_SPROCKET_TEXT_LENGTH = 48

export type CompositionPattern = 'none' | 'grid' | 'dots'
export type CompositionFitMode = 'cover' | 'contain'
export type CompositionOutputFormat = 'jpeg' | 'png'
export type CompositionRatioMode = 'preset' | 'custom' | 'auto'
export type CompositionLayoutDirection = 'horizontal' | 'vertical'
export type CompositionFrameFormat = 'half' | 'full'
export type CompositionFrameCount = 1 | 2
export type CompositionCanvasSizeAnchor = 'width' | 'height'
export type CompositionCanvasSizeMode = 'auto' | 'manual'
export type CompositionSprocketPlacement = 'top-bottom' | 'left-right'
export type CompositionSprocketColor = 'background' | 'black'
export type CompositionSprocketTextColorPreset = 'amber' | 'white' | 'black'

export const COMPOSITION_SPROCKET_TEXT_COLORS: Record<CompositionSprocketTextColorPreset, string> =
  {
    amber: '#DFA25F',
    white: '#F2EEE6',
    black: '#161616'
  }

export interface CompositionFrameFormatSpec {
  ratio: number
  longSide: number
  layoutDirection: CompositionLayoutDirection
}

const HALF_FRAME_LONG_SIDE = 1596

// Defaults used before any image is loaded. A 135 full frame (36 × 24 mm) has a long side
// 1.5× that of a half frame (18 × 24 mm) scanned at the same density.
export const COMPOSITION_FRAME_FORMATS: Record<CompositionFrameFormat, CompositionFrameFormatSpec> =
  {
    half: { ratio: 2 / 3, longSide: HALF_FRAME_LONG_SIDE, layoutDirection: 'horizontal' },
    full: { ratio: 3 / 2, longSide: HALF_FRAME_LONG_SIDE * 1.5, layoutDirection: 'vertical' }
  }

export interface CompositionImageTransform {
  scale: number
  offsetX: number
  offsetY: number
}

export interface CompositionImage {
  name: string
  decoded: DecodedImage
  transform: CompositionImageTransform
}

export interface CompositionPadding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface CompositionSprocket {
  enabled: boolean
  placement: CompositionSprocketPlacement
  color: CompositionSprocketColor
  width: number
  text: string
  textColor: string
}

export interface CompositionSettings {
  frameFormat: CompositionFrameFormat
  frameCount: CompositionFrameCount
  ratioMode: CompositionRatioMode
  ratio: number
  customRatioWidth: number
  customRatioHeight: number
  canvasWidth: number
  canvasHeight: number
  canvasSizeAnchor: CompositionCanvasSizeAnchor
  canvasSizeMode: CompositionCanvasSizeMode
  layoutDirection: CompositionLayoutDirection
  background: string
  pattern: CompositionPattern
  sprocket: CompositionSprocket
  filmTexture: boolean
  fit: CompositionFitMode
  padding: CompositionPadding
  gap: number
  outputFormat: CompositionOutputFormat
  outputQuality: number
}

export interface CompositionFrame {
  x: number
  y: number
  width: number
  height: number
}

export interface CompositionGeometry {
  width: number
  height: number
  frames: CompositionFrame[]
}

export interface CompositionOutputGeometry {
  width: number
  height: number
  contentOffsetX: number
  contentOffsetY: number
}

export const clampCompositionSprocketWidth = (width: number) =>
  Math.min(
    MAX_COMPOSITION_SPROCKET_WIDTH,
    Math.max(MIN_COMPOSITION_SPROCKET_WIDTH, Math.round(width))
  )

export const getCompositionOutputGeometry = (
  geometry: CompositionGeometry,
  sprocket: CompositionSprocket
): CompositionOutputGeometry => {
  if (!sprocket.enabled) {
    return {
      width: geometry.width,
      height: geometry.height,
      contentOffsetX: 0,
      contentOffsetY: 0
    }
  }

  const width = clampCompositionSprocketWidth(sprocket.width)

  return sprocket.placement === 'top-bottom'
    ? {
        width: geometry.width,
        height: geometry.height + width * 2,
        contentOffsetX: 0,
        contentOffsetY: width
      }
    : {
        width: geometry.width + width * 2,
        height: geometry.height,
        contentOffsetX: width,
        contentOffsetY: 0
      }
}
