export type Rotation = 0 | 90 | 180 | 270

export type ExportFormat = 'jpeg' | 'png' | 'webp' | 'tiff'

export type QueueStatus = 'ready' | 'processing' | 'done' | 'error'

export type AnalysisStatus = 'pending' | 'analyzing' | 'done' | 'failed'

export interface SplitSettings {
  center: number
  gap: number
  leftRotation: Rotation
  rightRotation: Rotation
}

export interface ImageQueueItem {
  id: string
  file: File
  name: string
  size: number
  status: QueueStatus
  analysisStatus: AnalysisStatus
  error?: string
  settings: SplitSettings
  detectedSettings?: Pick<SplitSettings, 'center' | 'gap'>
  settingsTouched?: boolean
}

export interface SplitDetectionResult {
  center: number
  gap: number
  confidence: number
}

export interface DecodedImage {
  source: CanvasImageSource
  width: number
  height: number
  pixels?: Uint8ClampedArray
  dispose: () => void
}

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}
