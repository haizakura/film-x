import type { DecodedImage } from '~/types/image'

export const MAX_COMPOSITION_CANVAS_SIDE = 8000
export const MIN_COMPOSITION_SPROCKET_WIDTH = 24
export const MAX_COMPOSITION_SPROCKET_WIDTH = 240

export type CompositionPattern = 'none' | 'grid' | 'dots'
export type CompositionFitMode = 'cover' | 'contain'
export type CompositionOutputFormat = 'jpeg' | 'png'
export type CompositionRatioMode = 'preset' | 'custom' | 'auto'
export type CompositionLayoutDirection = 'horizontal' | 'vertical'
export type CompositionCanvasSizeAnchor = 'width' | 'height'
export type CompositionCanvasSizeMode = 'auto' | 'manual'
export type CompositionSprocketPlacement = 'top-bottom' | 'left-right'
export type CompositionSprocketColor = 'background' | 'black'

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
}

export interface CompositionSettings {
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

  const width = Math.min(
    MAX_COMPOSITION_SPROCKET_WIDTH,
    Math.max(MIN_COMPOSITION_SPROCKET_WIDTH, Math.round(sprocket.width))
  )

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
