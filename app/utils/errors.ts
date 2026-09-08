export type AppErrorCode =
  | 'imageEncodeFailed'
  | 'tiffImageMissing'
  | 'canvasUnavailable'
  | 'exportCanvasUnavailable'
  | 'noImagesGenerated'

export class AppError extends Error {
  constructor(readonly code: AppErrorCode) {
    super(`errors.${code}`)
    this.name = 'AppError'
  }
}

export const errorMessageKey = (error: unknown, fallbackKey: string) =>
  error instanceof Error ? error.message : fallbackKey
