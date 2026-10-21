import { AppError } from '~/utils/errors'

export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  format: 'jpeg' | 'png' | 'webp',
  quality?: number
) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new AppError('imageEncodeFailed'))
        // Browsers without an encoder for the type (Safari for WebP) silently return PNG.
        else if (blob.type !== `image/${format}`) reject(new AppError('formatUnsupported'))
        else resolve(blob)
      },
      `image/${format}`,
      format === 'png' ? undefined : quality
    )
  })

export const releaseCanvas = (canvas: HTMLCanvasElement) => {
  canvas.width = 0
  canvas.height = 0
}

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
