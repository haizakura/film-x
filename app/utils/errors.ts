export type AppErrorCode =
  | 'imageEncodeFailed'
  | 'tiffImageMissing'
  | 'tiffCorrupt'
  | 'tiffUnsupported'
  | 'canvasUnavailable'
  | 'exportCanvasUnavailable'
  | 'noImagesGenerated'
  | 'framePresetInvalid'
  | 'framePresetUnsupported'

export class AppError extends Error {
  constructor(readonly code: AppErrorCode) {
    super(`errors.${code}`)
    this.name = 'AppError'
  }
}

/** Only AppError messages are i18n keys; raw browser or library text is never shown. */
export const errorMessageKey = (error: unknown, fallbackKey: string) =>
  error instanceof AppError ? error.message : fallbackKey
