import type { DecodedImage } from '~/types/image'

export type CompositionPattern = 'none' | 'grid' | 'dots'
export type CompositionFitMode = 'cover' | 'contain'
export type CompositionOutputFormat = 'jpeg' | 'png'
export type CompositionRatioMode = 'preset' | 'custom' | 'auto'
export type CompositionLayoutDirection = 'horizontal' | 'vertical'

export interface CompositionImage {
  name: string
  decoded: DecodedImage
}

export interface CompositionPadding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface CompositionSettings {
  ratioMode: CompositionRatioMode
  ratio: number
  customRatioWidth: number
  customRatioHeight: number
  layoutDirection: CompositionLayoutDirection
  background: string
  pattern: CompositionPattern
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
