export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  format: 'jpeg' | 'png' | 'webp',
  quality?: number
) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('图像编码失败'))),
      `image/${format}`,
      format === 'png' ? undefined : quality
    )
  })

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
