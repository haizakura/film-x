import { AGENT_RENDERER_PROTOCOL } from '~/types/agent'
import type {
  ComposeRequest,
  ComposeResponse,
  ExifRequest,
  ExifResponse,
  FilmXRenderer,
  FramePresetResponse,
  FrameRequest,
  FrameResponse,
  FrameSettingsRequest,
  InputRef,
  OutputRef,
  PixelSize,
  PreviewOptions,
  SplitRequest,
  SplitResponse
} from '~/types/agent'
import { getCompositionOutputGeometry } from '~/types/composition'
import type { CompositionImage } from '~/types/composition'
import { FRAME_INFO_FIELDS, MAX_FRAME_TEXT_LENGTH } from '~/types/frame'
import type { CameraBrandId, FrameInfoFields, FrameSettings, FrameSourceType } from '~/types/frame'
import type { CropRect, DecodedImage, Rotation } from '~/types/image'
import { getCameraBrand } from '~/utils/cameraBrands'
import { drawComposition, hasSupportedCanvasDimensions } from '~/utils/compositionCanvas'
import { getCompositionGeometry } from '~/utils/compositionGeometry'
import {
  createDefaultCompositionSettings,
  sanitizeCompositionSettings
} from '~/utils/compositionSettings'
import { canvasToBlob } from '~/utils/download'
import { AppError } from '~/utils/errors'
import { readPhotoExif } from '~/utils/exif'
import { createFilmGrainTiles, releaseFilmGrainTiles } from '~/utils/filmTexture'
import type { FilmGrainTiles } from '~/utils/filmTexture'
import { loadFrameFonts } from '~/utils/frameFonts'
import { resolveFrameLogoAsset } from '~/utils/frameLogos'
import {
  createEmptyFrameFields,
  detectFrameSourceType,
  getFrameExifFill
} from '~/utils/frameMetadata'
import { decodeFramePreset, encodeFramePreset, sanitizeFrameSettings } from '~/utils/framePreset'
import {
  applyFrameSourceType,
  applyFrameTemplate,
  createDefaultFrameSettings,
  getBrandLogo
} from '~/utils/frameSettings'
import { calculateCropRects, decodeImage, DEFAULT_SETTINGS, renderCrop } from '~/utils/image'
import {
  buildFrameCaption,
  drawFrame,
  getFrameCanvasSize,
  getFrameOutputLimit,
  getFrameScale,
  getFrameSceneFonts,
  getFrameSceneLayout
} from '~/utils/photoFrame'
import { detectSplit } from '~/utils/splitDetection'

// The renderer behind the local MCP server: each job reads its inputs from and writes its
// outputs to the server's loopback bridge, using the same utils as the web tools.

const PREVIEW_QUALITY = 0.85

/** Fetches a bridged input as a File so name-based checks such as isTiff keep working. */
const fetchInput = async (input: InputRef) => {
  const response = await fetch(input.url)
  if (!response.ok) throw new Error(`Input read failed (${response.status}): ${input.name}`)
  const blob = await response.blob()
  return new File([blob], input.name, { type: blob.type })
}

const postOutput = async (output: OutputRef, blob: Blob) => {
  const response = await fetch(output.url, { method: 'POST', body: blob })
  if (!response.ok) {
    throw new Error(`Output write failed (${response.status}): ${await response.text()}`)
  }
}

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    releaseCanvas(canvas)
    throw new AppError('exportCanvasUnavailable')
  }
  return { canvas, context }
}

const releaseCanvas = (canvas: HTMLCanvasElement) => {
  canvas.width = 0
  canvas.height = 0
}

const toBase64 = async (blob: Blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return btoa(binary)
}

/** Small JPEG for the agent to look at; the full-size file is written separately. */
const encodePreview = async (
  size: PixelSize,
  options: PreviewOptions | undefined,
  draw: (context: CanvasRenderingContext2D, width: number, height: number) => void
) => {
  if (!options) return undefined
  const scale = Math.min(1, options.maxSide / Math.max(size.width, size.height))
  const { canvas, context } = createCanvas(
    Math.max(1, Math.round(size.width * scale)),
    Math.max(1, Math.round(size.height * scale))
  )
  try {
    // JPEG has no alpha, so transparent PNG areas would otherwise turn black.
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    draw(context, canvas.width, canvas.height)
    return await toBase64(await canvasToBlob(canvas, 'jpeg', PREVIEW_QUALITY))
  } finally {
    releaseCanvas(canvas)
  }
}

const PREVIEW_GAP = 16

const rotatedSize = (rect: CropRect, rotation: Rotation): PixelSize =>
  rotation === 90 || rotation === 270
    ? { width: rect.height, height: rect.width }
    : { width: rect.width, height: rect.height }

/** Draws a crop into a box that already has the rotated proportions. */
const drawRotatedCrop = (
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

const split = async (request: SplitRequest): Promise<SplitResponse> => {
  const image = await decodeImage(await fetchInput(request.input))
  try {
    // Detection always runs unless both values are given, so one override keeps the other.
    const manual = request.center !== undefined && request.gap !== undefined
    const detection = manual ? undefined : detectSplit(image)
    const center = request.center ?? detection?.center ?? DEFAULT_SETTINGS.center
    const gap = request.gap ?? detection?.gap ?? DEFAULT_SETTINGS.gap
    const rotations = [request.leftRotation, request.rightRotation] as const
    const rects = calculateCropRects(image.width, image.height, {
      center,
      gap,
      leftRotation: request.leftRotation,
      rightRotation: request.rightRotation
    })

    // One full-size crop at a time keeps peak memory close to the web export.
    // oxlint-disable no-await-in-loop
    for (const [index, rect] of rects.entries()) {
      const blob = await renderCrop(
        image,
        rect,
        rotations[index] ?? 0,
        request.format,
        request.quality
      )
      const output = request.outputs[index]
      if (output) await postOutput(output, blob)
    }
    // oxlint-enable no-await-in-loop

    const crops: [PixelSize, PixelSize] = [
      rotatedSize(rects[0], request.leftRotation),
      rotatedSize(rects[1], request.rightRotation)
    ]
    const previewSize = {
      width: crops[0].width + crops[1].width + PREVIEW_GAP,
      height: Math.max(crops[0].height, crops[1].height)
    }
    const preview = await encodePreview(previewSize, request.preview, (context, width) => {
      const scale = width / previewSize.width
      let x = 0
      for (const [index, rect] of rects.entries()) {
        const crop = crops[index] ?? crops[0]
        drawRotatedCrop(context, image.source, rect, rotations[index] ?? 0, {
          x,
          y: 0,
          width: crop.width * scale,
          height: crop.height * scale
        })
        x += (crop.width + PREVIEW_GAP) * scale
      }
    })

    return {
      source: { width: image.width, height: image.height },
      detection,
      center,
      gap,
      crops,
      preview
    }
  } finally {
    image.dispose()
  }
}

const compose = async (request: ComposeRequest): Promise<ComposeResponse> => {
  const settings = sanitizeCompositionSettings(
    { ...request.settings, frameCount: request.inputs.length },
    createDefaultCompositionSettings()
  )
  const images: CompositionImage[] = []
  let canvas: HTMLCanvasElement | undefined
  let grainTiles: FilmGrainTiles | undefined
  try {
    // Decoding stays serial, as in the web composer.
    // oxlint-disable no-await-in-loop
    for (const input of request.inputs.slice(0, settings.frameCount)) {
      const decoded = await decodeImage(await fetchInput(input))
      images.push({ name: input.name, decoded, transform: { scale: 1, offsetX: 0, offsetY: 0 } })
    }
    // oxlint-enable no-await-in-loop

    const geometry = getCompositionGeometry(
      settings,
      images.map((image) => image.decoded)
    )
    const size = getCompositionOutputGeometry(geometry, settings.sprocket)
    if (!hasSupportedCanvasDimensions(size)) throw new Error('Unsupported canvas size')

    const target = createCanvas(size.width, size.height)
    canvas = target.canvas
    if (settings.filmTexture) grainTiles = createFilmGrainTiles()
    drawComposition(target.context, {
      geometry,
      settings,
      images,
      placeholderLabel: () => '',
      grainTiles
    })
    await postOutput(
      request.output,
      await canvasToBlob(canvas, settings.outputFormat, settings.outputQuality)
    )

    const rendered = canvas
    const preview = await encodePreview(size, request.preview, (context, width, height) =>
      context.drawImage(rendered, 0, 0, width, height)
    )
    return { size: { width: size.width, height: size.height }, settings, preview }
  } finally {
    if (canvas) releaseCanvas(canvas)
    if (grainTiles) releaseFilmGrainTiles(grainTiles)
    for (const image of images) image.decoded.dispose()
  }
}

const SOURCE_TYPES: readonly FrameSourceType[] = ['digital', 'film']

const isSourceType = (value: unknown): value is FrameSourceType =>
  SOURCE_TYPES.includes(value as FrameSourceType)

/** Mirrors selectBrand in the web editor: the logo follows the brand, so does the tagline. */
const selectBrand = (settings: FrameSettings, id: CameraBrandId, keepTagline: boolean) => {
  const brand = getCameraBrand(id)
  Object.assign(settings.logo, getBrandLogo(brand, settings.logo))
  if (!keepTagline) settings.tagline = brand.tagline ?? ''
}

/**
 * Builds settings the way the web editor would after the same choices: defaults, then the
 * preset code, template, brand and finally individual values, each sanitised like a preset.
 */
const resolveSettings = (request: FrameSettingsRequest) => {
  let settings = createDefaultFrameSettings()
  if (request.preset) {
    const preset = decodeFramePreset(request.preset, settings)
    const brandChanged = preset.logo.brand !== settings.logo.brand
    settings = { ...preset, tagline: settings.tagline, outputQuality: settings.outputQuality }
    if (brandChanged) settings.tagline = getCameraBrand(preset.logo.brand).tagline ?? ''
  }
  if (request.template) applyFrameTemplate(settings, request.template)
  if (request.brand) selectBrand(settings, request.brand, false)
  if (request.settings) {
    // A source change swaps the film and exposure lines unless the lines are given too.
    if (isSourceType(request.settings.sourceType)) {
      applyFrameSourceType(settings, request.settings.sourceType)
    }
    settings = sanitizeFrameSettings(request.settings, settings)
  }
  return settings
}

const readFields = (fields: FrameRequest['fields']) =>
  Object.fromEntries(
    FRAME_INFO_FIELDS.flatMap((field) => {
      const value = fields?.[field]
      return typeof value === 'string' ? [[field, value.slice(0, MAX_FRAME_TEXT_LENGTH)]] : []
    })
  ) as Partial<FrameInfoFields>

const frame = async (request: FrameRequest): Promise<FrameResponse> => {
  const settings = resolveSettings(request)
  const file = await fetchInput(request.input)
  // EXIF reads only small slices, so it runs before the full decode, as in the web editor.
  const exif = await readPhotoExif(file)
  const photo = await decodeImage(file)
  let logo: DecodedImage | undefined
  let canvas: HTMLCanvasElement | undefined
  try {
    const fields = createEmptyFrameFields()
    if (request.autoExif) {
      // Explicit choices count as manual ones, which EXIF never overrides in the web editor.
      const sourceChosen = Boolean(request.preset || isSourceType(request.settings?.sourceType))
      const brandChosen = Boolean(request.preset || request.brand || request.settings?.logo)
      const detected = detectFrameSourceType(exif)
      if (detected && !sourceChosen) applyFrameSourceType(settings, detected)
      const fill = getFrameExifFill(exif, settings.sourceType, false)
      if (fill.brandId && !brandChosen && fill.brandId !== settings.logo.brand) {
        selectBrand(settings, fill.brandId, typeof request.settings?.tagline === 'string')
      }
      Object.assign(fields, fill.values)
    }
    Object.assign(fields, readFields(request.fields))

    if (request.customLogo) {
      logo = await decodeImage(await fetchInput(request.customLogo))
      settings.logo.style = 'custom'
    }
    await loadFrameFonts(getFrameSceneFonts(settings))
    const logoAsset = await resolveFrameLogoAsset(settings.logo, logo)

    const layout = getFrameSceneLayout(photo, settings)
    const scale = getFrameScale(layout, getFrameOutputLimit(settings))
    const size = getFrameCanvasSize(layout, scale)
    const target = createCanvas(size.width, size.height)
    canvas = target.canvas
    drawFrame(
      target.context,
      {
        layout,
        settings,
        caption: buildFrameCaption(fields, settings),
        photo: photo.source,
        logo: logoAsset,
        placeholder: ''
      },
      scale
    )
    await postOutput(
      request.output,
      await canvasToBlob(canvas, settings.outputFormat, settings.outputQuality)
    )

    const rendered = canvas
    const preview = await encodePreview(size, request.preview, (context, width, height) =>
      context.drawImage(rendered, 0, 0, width, height)
    )
    return { size, settings, fields, presetCode: encodeFramePreset(settings), exif, preview }
  } finally {
    if (canvas) releaseCanvas(canvas)
    photo.dispose()
    logo?.dispose()
  }
}

const framePreset = async (request: FrameSettingsRequest): Promise<FramePresetResponse> => {
  const settings = resolveSettings(request)
  return { settings, presetCode: encodeFramePreset(settings) }
}

const readExif = async (request: ExifRequest): Promise<ExifResponse> => {
  const exif = await readPhotoExif(await fetchInput(request.input))
  const sourceType = detectFrameSourceType(exif)
  const fill = getFrameExifFill(exif, sourceType ?? 'digital', false)
  return {
    exif,
    brand: fill.brandId,
    sourceType,
    fields: { ...createEmptyFrameFields(), ...fill.values }
  }
}

/** The `window.filmX` object the MCP server calls; only the renderer page installs it. */
export const createAgentRenderer = (): FilmXRenderer => ({
  protocol: AGENT_RENDERER_PROTOCOL,
  split,
  compose,
  frame,
  readExif,
  framePreset
})
