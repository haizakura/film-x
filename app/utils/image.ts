import UTIF from 'utif'

import type { CropRect, DecodedImage, ExportFormat, Rotation, SplitSettings } from '~/types/image'
import { canvasToBlob, releaseCanvas } from '~/utils/download'
import { AppError } from '~/utils/errors'

export const DEFAULT_SETTINGS: SplitSettings = {
  center: 0.5,
  gap: 0.018,
  leftRotation: 0,
  rightRotation: 0
}

export const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff']

export const IMAGE_FILE_ACCEPT = 'image/jpeg,image/png,image/webp,image/tiff,.tif,.tiff'

export const isSupportedImage = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension ? SUPPORTED_EXTENSIONS.includes(extension) : false
}

export const partitionSupportedImages = (files: File[]) => {
  const supported = files.filter(isSupportedImage)
  return { supported, rejectedCount: files.length - supported.length }
}

export const isTiff = (file: File) => /\.(tif|tiff)$/i.test(file.name)

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

const TIFF_ENTRY_SIZE = 12
// PhotometricInterpretation values UTIF.toRGBA8 renders; it returns black for anything else.
const TIFF_RENDERABLE_PHOTOMETRIC = new Set([0, 1, 2, 3, 5])

/** Walks the IFD chain UTIF.decode follows, which has no cycle check of its own. */
const assertTiffChain = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  const littleEndian = bytes[0] === 0x49 && bytes[1] === 0x49
  if (!littleEndian && !(bytes[0] === 0x4d && bytes[1] === 0x4d)) {
    throw new AppError('tiffCorrupt')
  }
  // Bytes past the end read as zeros, as in utif, so a dangling pointer ends both chains alike.
  const read = (offset: number, size: number) => {
    let value = 0
    for (let index = 0; index < size; index += 1) {
      value = value * 256 + (bytes[offset + (littleEndian ? size - 1 - index : index)] ?? 0)
    }
    return value
  }
  // utif only reads classic TIFF (42); BigTIFF (43) would be parsed as garbage.
  if (read(2, 2) !== 42) throw new AppError('tiffUnsupported')

  let offset = read(4, 4)
  // The first IFD describes the image, so it has to lie inside the file.
  if (offset < 8 || offset + 2 + read(offset, 2) * TIFF_ENTRY_SIZE + 4 > bytes.length) {
    throw new AppError('tiffCorrupt')
  }
  const visited = new Set<number>()
  while (offset !== 0) {
    if (visited.has(offset)) throw new AppError('tiffCorrupt')
    visited.add(offset)
    offset = read(offset + 2 + read(offset, 2) * TIFF_ENTRY_SIZE, 4)
  }
}

const decodeImageRaw = async (file: File): Promise<DecodedImage> => {
  if (isTiff(file)) {
    const buffer = await file.arrayBuffer()
    assertTiffChain(buffer)
    const ifds = UTIF.decode(buffer)
    const ifd = ifds[0]

    if (!ifd) throw new AppError('tiffImageMissing')

    UTIF.decodeImage(buffer, ifd)
    // Read after decodeImage: JPEG-compressed YCbCr (6) is rewritten to RGB (2) there.
    const photometric = (ifd.t262 as number[] | undefined)?.[0] ?? 2
    if (!TIFF_RENDERABLE_PHOTOMETRIC.has(photometric)) throw new AppError('tiffUnsupported')

    // toRGBA8 returns a fresh, unshared array, so a view avoids a second full-size copy.
    const rgba = UTIF.toRGBA8(ifd)
    const pixels = new Uint8ClampedArray(
      rgba.buffer as ArrayBuffer,
      rgba.byteOffset,
      rgba.byteLength
    )
    const canvas = document.createElement('canvas')
    canvas.width = ifd.width
    canvas.height = ifd.height
    const context = canvas.getContext('2d')

    if (!context) {
      releaseCanvas(canvas)
      throw new AppError('canvasUnavailable')
    }

    context.putImageData(new ImageData(pixels, ifd.width, ifd.height), 0, 0)

    return {
      source: canvas,
      width: ifd.width,
      height: ifd.height,
      pixels,
      dispose: () => releaseCanvas(canvas)
    }
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  return {
    source: bitmap,
    width: bitmap.width,
    height: bitmap.height,
    dispose: () => bitmap.close()
  }
}

// Some browsers can leave concurrent createImageBitmap calls unresolved. Keeping
// decoding serial also caps peak memory when a batch contains large TIFF scans.
let decodeQueue = Promise.resolve()

export const decodeImage = (file: File): Promise<DecodedImage> => {
  const decoded = decodeQueue.then(() => decodeImageRaw(file))
  decodeQueue = decoded.then(
    () => undefined,
    () => undefined
  )
  return decoded
}

export const calculateCropRects = (
  width: number,
  height: number,
  settings: SplitSettings
): [CropRect, CropRect] => {
  const splitX = Math.round(width * settings.center)
  const halfGap = Math.round((width * settings.gap) / 2)
  const leftEnd = Math.max(1, Math.min(width - 1, splitX - halfGap))
  const rightStart = Math.max(1, Math.min(width - 1, splitX + halfGap))

  return [
    { x: 0, y: 0, width: leftEnd, height },
    { x: rightStart, y: 0, width: Math.max(1, width - rightStart), height }
  ]
}

export const rotatedSize = (rect: CropRect, rotation: Rotation) =>
  rotation === 90 || rotation === 270
    ? { width: rect.height, height: rect.width }
    : { width: rect.width, height: rect.height }

/** Draws a crop into a box that already has the rotated proportions. */
export const drawRotatedCrop = (
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  rect: CropRect,
  rotation: Rotation,
  box: { x: number; y: number; width: number; height: number }
) => {
  const swapped = rotation === 90 || rotation === 270
  const width = swapped ? box.height : box.width
  const height = swapped ? box.width : box.height
  context.save()
  context.translate(box.x + box.width / 2, box.y + box.height / 2)
  context.rotate((rotation * Math.PI) / 180)
  context.drawImage(
    source,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    -width / 2,
    -height / 2,
    width,
    height
  )
  context.restore()
}

const rotateRgbaCrop = (
  source: Uint8ClampedArray,
  sourceWidth: number,
  rect: CropRect,
  rotation: Rotation
) => {
  const { width, height } = rotatedSize(rect, rotation)
  const pixels = new Uint8Array(width * height * 4)
  // Copy one RGBA pixel per element; Uint32Array views need a 4-byte aligned offset.
  const aligned = source.byteOffset % 4 === 0 ? source : source.slice()
  const input = new Uint32Array(aligned.buffer, aligned.byteOffset, aligned.length >> 2)
  const output = new Uint32Array(pixels.buffer)

  for (let y = 0; y < rect.height; y += 1) {
    for (let x = 0; x < rect.width; x += 1) {
      let outputX = x
      let outputY = y

      if (rotation === 90) {
        outputX = rect.height - 1 - y
        outputY = x
      } else if (rotation === 180) {
        outputX = rect.width - 1 - x
        outputY = rect.height - 1 - y
      } else if (rotation === 270) {
        outputX = y
        outputY = rect.width - 1 - x
      }

      output[outputY * width + outputX] = input[(rect.y + y) * sourceWidth + rect.x + x] ?? 0
    }
  }

  return { pixels, width, height }
}

const renderCropCanvas = (decoded: DecodedImage, rect: CropRect, rotation: Rotation) => {
  const { width, height } = rotatedSize(rect, rotation)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (!context) {
    releaseCanvas(canvas)
    throw new AppError('exportCanvasUnavailable')
  }

  context.imageSmoothingEnabled = false
  drawRotatedCrop(context, decoded.source, rect, rotation, { x: 0, y: 0, width, height })

  return { canvas, context }
}

const renderTiffCrop = (decoded: DecodedImage, rect: CropRect, rotation: Rotation) => {
  let rendered: ReturnType<typeof rotateRgbaCrop>

  if (decoded.pixels) {
    rendered = rotateRgbaCrop(decoded.pixels, decoded.width, rect, rotation)
  } else {
    const { canvas, context } = renderCropCanvas(decoded, rect, rotation)
    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      rendered = {
        pixels: new Uint8Array(
          imageData.data.buffer,
          imageData.data.byteOffset,
          imageData.data.byteLength
        ),
        width: canvas.width,
        height: canvas.height
      }
    } finally {
      releaseCanvas(canvas)
    }
  }

  const buffer = UTIF.encodeImage(rendered.pixels, rendered.width, rendered.height)
  return new Blob([buffer], { type: 'image/tiff' })
}

export const renderCrop = async (
  decoded: DecodedImage,
  rect: CropRect,
  rotation: Rotation,
  format: ExportFormat,
  quality: number
) => {
  if (format === 'tiff') return renderTiffCrop(decoded, rect, rotation)

  const { canvas } = renderCropCanvas(decoded, rect, rotation)
  try {
    return await canvasToBlob(canvas, format, quality)
  } finally {
    releaseCanvas(canvas)
  }
}

export const baseName = (name: string) => name.replace(/\.[^.]+$/, '')

export const outputExtension = (format: ExportFormat) => {
  if (format === 'jpeg') return 'jpg'
  if (format === 'tiff') return 'tif'
  return format
}

export const rotateClockwise = (rotation: Rotation): Rotation => ((rotation + 90) % 360) as Rotation

export const rotateCounterClockwise = (rotation: Rotation): Rotation =>
  ((rotation + 270) % 360) as Rotation
