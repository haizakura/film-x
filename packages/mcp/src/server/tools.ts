import path from 'node:path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js'
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import {
  CANVAS_RATIO_PRESETS,
  MAX_CANVAS_RATIO,
  MAX_CANVAS_RATIO_TERM,
  MIN_CANVAS_RATIO
} from '~/types/canvas'
import {
  COMPOSITION_FRAME_FORMATS,
  COMPOSITION_SPROCKET_TEXT_COLORS,
  MAX_COMPOSITION_CANVAS_SIDE,
  MAX_COMPOSITION_GAP,
  MAX_COMPOSITION_PADDING,
  MAX_COMPOSITION_SPROCKET_TEXT_LENGTH,
  MAX_COMPOSITION_SPROCKET_WIDTH,
  MIN_COMPOSITION_SPROCKET_WIDTH
} from '~/types/composition'
import type { CameraBrandId, FrameInfoField, FrameTemplate } from '~/types/frame'
import {
  FRAME_INFO_FIELDS,
  FRAME_TEMPLATES,
  MAX_FRAME_CANVAS_SIDE,
  MAX_FRAME_PRESET_LENGTH,
  MAX_FRAME_TEXT_LENGTH,
  MIN_FRAME_OUTPUT_SIDE
} from '~/types/frame'
import type { ExportFormat, Rotation } from '~/types/image'
import { MAX_SPLIT_CENTER, MAX_SPLIT_GAP, MIN_SPLIT_CENTER } from '~/types/image'
import { CAMERA_BRANDS } from '~/utils/cameraBrands'
import type { RendererMethod, RendererRequest, RendererResponse } from '~/types/agent'
import type { Bridge } from './bridge'
import type { RendererHost } from './browser'
import { UserError, describeError, toolError } from './errors'
import {
  checkOutputs,
  defaultOutputName,
  ensureDir,
  formatFromExtension,
  listImages,
  resolveExplicitOutput,
  resolveInput,
  resolveUserPath
} from './paths'
import type { ResolvedInput } from './paths'

const PREVIEW_MAX_SIDE = 1024
const MAX_SPLIT_FILES = 50
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

const enumOf = <T extends string>(values: readonly T[]) => z.enum(values as unknown as [T, ...T[]])

const templateIds = Object.keys(FRAME_TEMPLATES) as FrameTemplate[]
const brandIds = CAMERA_BRANDS.map((brand) => brand.id) as CameraBrandId[]
const frameFormats = Object.keys(COMPOSITION_FRAME_FORMATS) as Array<
  keyof typeof COMPOSITION_FRAME_FORMATS
>

const rotationSchema = z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)])
const qualityFor = (fallback: number) =>
  z.number().min(0).max(1).default(fallback).describe('Encoder quality from 0 to 1.')

const overwriteSchema = z
  .boolean()
  .default(false)
  .describe('Replace output files that already exist. Default false: existing files are refused.')
const previewSchema = z
  .boolean()
  .default(true)
  .describe(`Attach a JPEG preview (long side ${PREVIEW_MAX_SIDE} px) of the result. Default true.`)

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const
const WRITES_FILES = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false
} as const

const json = (value: unknown): CallToolResult['content'][number] => ({
  type: 'text',
  text: JSON.stringify(value, null, 2)
})

const withPreview = (value: unknown, preview?: string): CallToolResult => ({
  content: [
    json(value),
    ...(preview ? [{ type: 'image' as const, data: preview, mimeType: 'image/jpeg' }] : [])
  ]
})

interface ToolContext {
  host: RendererHost
}

type Extra = RequestHandlerExtra<ServerRequest, ServerNotification>

const reportProgress = async (extra: Extra, progress: number, total: number, message: string) => {
  // `_meta` is the protocol's own field name.
  // oxlint-disable-next-line no-underscore-dangle
  const progressToken = extra._meta?.progressToken
  if (progressToken === undefined) return
  try {
    await extra.sendNotification({
      method: 'notifications/progress',
      params: { progressToken, progress, total, message }
    })
  } catch {
    // Progress is best effort; the client may have stopped listening.
  }
}

/** Registers a file with the bridge for the duration of one renderer job. */
class Job {
  private readonly refs: Parameters<Bridge['release']> = []
  private readonly pending: Array<Promise<void>> = []

  constructor(readonly bridge: Bridge) {}

  input(file: { path: string; name: string }) {
    const ref = this.bridge.registerInput(file.path, file.name)
    this.refs.push(ref)
    return ref
  }

  output(file: string, overwrite: boolean) {
    const { ref, written } = this.bridge.registerOutput(file, { overwrite })
    this.refs.push(ref)
    this.pending.push(written)
    return ref
  }

  /** Waits until every output is on disk. */
  async flush() {
    await Promise.all(this.pending)
  }

  release() {
    this.bridge.release(...this.refs)
  }
}

const render = async <M extends RendererMethod>(
  ctx: ToolContext,
  method: M,
  build: (job: Job) => RendererRequest<M>
): Promise<RendererResponse<M>> => {
  const job = new Job(await ctx.host.ensureBridge())
  try {
    const response = await ctx.host.call(method, build(job))
    await job.flush()
    return response
  } finally {
    job.release()
  }
}

const pixelSize = (size: { width: number; height: number }) => `${size.width}x${size.height}`

export const registerTools = (server: McpServer, ctx: ToolContext) => {
  server.registerTool(
    'list_images',
    {
      title: 'List images in a folder',
      description:
        'Lists the image files Film X can read (jpg, jpeg, png, webp, tif, tiff) in a folder on this ' +
        'computer, with size in bytes and modification time. Use it to find scans before calling ' +
        'the other tools. Images attached to the chat are NOT visible to this server, so the user ' +
        'must provide file or folder paths. If dir is omitted, the FILM_X_IMAGE_DIR environment ' +
        'variable is used; if neither is set, ask the user for a folder.',
      inputSchema: {
        dir: z
          .string()
          .optional()
          .describe('Absolute folder path, or one starting with "~/". Hidden files are skipped.'),
        recursive: z
          .boolean()
          .default(false)
          .describe(
            'Also list sub-folders, breadth first: nearer folders come first, each in name order. Default false.'
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(2000)
          .default(200)
          .describe('Maximum number of files to return. Default 200.')
      },
      annotations: { title: 'List images in a folder', ...READ_ONLY }
    },
    async ({ dir, recursive, limit }) => {
      try {
        const folder = dir ?? process.env.FILM_X_IMAGE_DIR
        if (!folder?.trim()) {
          throw new UserError(
            'No folder given. Ask the user which folder holds their images (absolute path), ' +
              'or have them set FILM_X_IMAGE_DIR in the server configuration.'
          )
        }
        const result = await listImages(folder, recursive, limit)
        return { content: [json({ ...result, count: result.images.length })] }
      } catch (error) {
        return toolError(error)
      }
    }
  )

  server.registerTool(
    'read_photo_exif',
    {
      title: 'Read photo EXIF',
      description:
        'Reads the EXIF metadata of a JPEG, PNG, WebP or TIFF photo and shows how Film X would fill ' +
        'the photo-frame caption from it: the detected camera brand, whether the shot looks ' +
        'digital or film, and the caption fields (camera, lens, film, focalLength, aperture, ' +
        'shutter, iso, date). Nothing is written.',
      inputSchema: {
        path: z.string().min(1).describe('Absolute path of the photo, or one starting with "~/".')
      },
      annotations: { title: 'Read photo EXIF', ...READ_ONLY }
    },
    async ({ path: value }) => {
      try {
        const input = await resolveInput(value)
        const result = await render(ctx, 'readExif', (job) => ({ input: job.input(input) }))
        return { content: [json({ path: input.path, ...result })] }
      } catch (error) {
        return toolError(error)
      }
    }
  )

  server.registerTool(
    'split_half_frame',
    {
      title: 'Split half-frame scans',
      description:
        'Splits scans of half-frame film (two portrait frames side by side on one landscape scan) ' +
        'into two image files per scan, named <name>_01 and <name>_02 (<name> is the scan name; ' +
        'TIFF output uses .tif) and written next to each scan unless outputDir is given. center ' +
        'and gap are fractions of the scan width. When both are omitted the dividing gutter is ' +
        'auto-detected; if the detection is not confident the gap is kept at 0 so no pixels are ' +
        'dropped. Each half can be rotated clockwise in 90 degree steps. Files are processed one ' +
        'by one; a failing file is reported and the rest continue. The preview shows the first ' +
        'file only. Returns the output paths and the resolved center, gap and crop sizes.',
      inputSchema: {
        paths: z
          .array(z.string().min(1))
          .min(1)
          .max(MAX_SPLIT_FILES)
          .describe(`1 to ${MAX_SPLIT_FILES} absolute scan paths (or starting with "~/").`),
        center: z
          .number()
          .min(MIN_SPLIT_CENTER)
          .max(MAX_SPLIT_CENTER)
          .optional()
          .describe(
            `Centre of the gutter as a fraction of the width (${MIN_SPLIT_CENTER} to ${MAX_SPLIT_CENTER}). Default: detect.`
          ),
        gap: z
          .number()
          .min(0)
          .max(MAX_SPLIT_GAP)
          .optional()
          .describe(
            `Gutter width cut away, as a fraction of the width (0 to ${MAX_SPLIT_GAP}). Default: detect.`
          ),
        leftRotation: rotationSchema
          .optional()
          .describe(
            'Clockwise rotation of the left half in degrees: 0, 90, 180 or 270. Default 0.'
          ),
        rightRotation: rotationSchema
          .optional()
          .describe(
            'Clockwise rotation of the right half in degrees: 0, 90, 180 or 270. Default 0.'
          ),
        format: enumOf<ExportFormat>(['jpeg', 'png', 'webp', 'tiff'])
          .default('jpeg')
          .describe('Output format. Default jpeg.'),
        quality: qualityFor(0.94).describe('Quality for jpeg and webp, 0 to 1. Default 0.94.'),
        outputDir: z
          .string()
          .optional()
          .describe('Folder for the outputs (created if missing). Default: next to each scan.'),
        overwrite: overwriteSchema,
        preview: previewSchema
      },
      annotations: { title: 'Split half-frame scans', ...WRITES_FILES }
    },
    async (args, extra) => {
      try {
        const inputs: Array<{ index: number; file: ResolvedInput }> = []
        const failures = new Map<number, string>()
        const resolved = await Promise.allSettled(args.paths.map((value) => resolveInput(value)))
        for (const [index, outcome] of resolved.entries()) {
          if (outcome.status === 'fulfilled') inputs.push({ index, file: outcome.value })
          else failures.set(index, describeError(outcome.reason))
        }
        const allInputPaths = inputs.map(({ file }) => file.path)
        const outputDir = args.outputDir
          ? resolveUserPath(args.outputDir, 'output folder')
          : undefined
        const claimed = new Set<string>()
        const format = args.format
        const results: Array<Record<string, unknown>> = []
        let previewData: string | undefined

        // Scans are split one at a time, like the web export, so only one full-size image is
        // decoded at once.
        // oxlint-disable no-await-in-loop
        for (const [index, value] of args.paths.entries()) {
          if (extra.signal.aborted) break
          const failure = failures.get(index)
          if (failure !== undefined) {
            results.push({ input: value, status: 'error', error: failure })
            await reportProgress(extra, index + 1, args.paths.length, `Skipped ${value}`)
            continue
          }
          const file = inputs.find((item) => item.index === index)!.file
          try {
            const dir = outputDir ?? path.dirname(file.path)
            const targets = [
              path.join(dir, defaultOutputName(file.name, '_01', format)),
              path.join(dir, defaultOutputName(file.name, '_02', format))
            ] as [string, string]
            await checkOutputs(targets, allInputPaths, args.overwrite, claimed)
            await ensureDir(dir)
            const response = await render(ctx, 'split', (job) => ({
              input: job.input(file),
              center: args.center,
              gap: args.gap,
              leftRotation: (args.leftRotation ?? 0) as Rotation,
              rightRotation: (args.rightRotation ?? 0) as Rotation,
              format,
              quality: args.quality,
              outputs: [
                job.output(targets[0], args.overwrite),
                job.output(targets[1], args.overwrite)
              ],
              preview: args.preview && !previewData ? { maxSide: PREVIEW_MAX_SIDE } : undefined
            }))
            if (response.preview) previewData = response.preview
            results.push({
              input: file.path,
              status: 'ok',
              outputs: targets,
              source: pixelSize(response.source),
              center: response.center,
              gap: response.gap,
              crops: response.crops.map(pixelSize),
              detection: response.detection
            })
          } catch (error) {
            results.push({
              input: file.path,
              status: 'error',
              error: describeError(error)
            })
          }
          await reportProgress(extra, index + 1, args.paths.length, `Processed ${file.name}`)
        }
        // oxlint-enable no-await-in-loop

        const succeeded = results.filter((item) => item.status === 'ok').length
        const summary = { succeeded, failed: results.length - succeeded, results }
        if (succeeded === 0) {
          return { isError: true, content: [json(summary)] }
        }
        return withPreview(summary, previewData)
      } catch (error) {
        return toolError(error)
      }
    }
  )

  server.registerTool(
    'compose_film',
    {
      title: 'Compose a film layout',
      description:
        'Composes one or two photos onto a single canvas, like a film strip or contact sheet, ' +
        'with optional padding, background, pattern, film sprocket holes with an edge-code ' +
        'text, and film grain texture. One image fills a single frame; two images are placed ' +
        'side by side (horizontal) or stacked (vertical). All pixel sizes are in output ' +
        `pixels; the canvas never exceeds ${MAX_COMPOSITION_CANVAS_SIDE} px on its longest side. ` +
        'By default the canvas size follows the photos and the output is written to ' +
        'film-x-layout.jpg next to the first photo. Returns the output path, the pixel size and ' +
        'the fully resolved settings.',
      inputSchema: {
        paths: z
          .array(z.string().min(1))
          .min(1)
          .max(2)
          .describe('One or two absolute photo paths (or starting with "~/"), in display order.'),
        frameFormat: enumOf(frameFormats)
          .default('half')
          .describe(
            'Film frame shape: "half" (portrait 2:3 frames, two across by default) or "full" ' +
              '(landscape 3:2 frames, stacked by default). Default half.'
          ),
        layoutDirection: z
          .enum(['horizontal', 'vertical'])
          .optional()
          .describe('How two frames are arranged. Default follows frameFormat.'),
        ratio: z
          .string()
          .regex(/^(auto|[1-9]\d?:[1-9]\d?)$/)
          .default('auto')
          .describe(
            `Canvas aspect ratio: "auto" (fit the frames) or "W:H" with whole numbers from 1 to ${MAX_CANVAS_RATIO_TERM}, such as ${CANVAS_RATIO_PRESETS.map((preset) => `"${preset.label}"`).join(', ')}. ` +
              `W/H must be between ${MIN_CANVAS_RATIO} and ${MAX_CANVAS_RATIO}. Frames are padded, never cropped. Default auto.`
          ),
        canvasWidth: z
          .number()
          .int()
          .min(1)
          .max(MAX_COMPOSITION_CANVAS_SIDE)
          .optional()
          .describe(
            'Fixed canvas width in px (the height follows). Give at most one of canvasWidth and canvasHeight; omit both for automatic size.'
          ),
        canvasHeight: z
          .number()
          .int()
          .min(1)
          .max(MAX_COMPOSITION_CANVAS_SIDE)
          .optional()
          .describe('Fixed canvas height in px (the width follows). See canvasWidth.'),
        padding: z
          .union([
            z.number().min(0).max(MAX_COMPOSITION_PADDING),
            z.object({
              top: z.number().min(0).max(MAX_COMPOSITION_PADDING),
              right: z.number().min(0).max(MAX_COMPOSITION_PADDING),
              bottom: z.number().min(0).max(MAX_COMPOSITION_PADDING),
              left: z.number().min(0).max(MAX_COMPOSITION_PADDING)
            })
          ])
          .optional()
          .describe(
            `Space around the frames in px: one number for all sides or {top,right,bottom,left}; 0 to ${MAX_COMPOSITION_PADDING}.`
          ),
        gap: z
          .number()
          .min(0)
          .max(MAX_COMPOSITION_GAP)
          .optional()
          .describe(`Space between two frames in px, 0 to ${MAX_COMPOSITION_GAP}.`),
        background: z
          .string()
          .regex(HEX_COLOR)
          .optional()
          .describe('Canvas background colour as #RRGGBB.'),
        pattern: z
          .enum(['none', 'grid', 'dots'])
          .optional()
          .describe('Background pattern: none, grid or dots.'),
        fit: z
          .enum(['cover', 'contain'])
          .optional()
          .describe(
            '"cover" fills each frame and crops the photo; "contain" shows the whole photo.'
          ),
        sprocket: z
          .object({
            enabled: z.boolean().optional().describe('Draw film sprocket holes. Default false.'),
            placement: z
              .enum(['top-bottom', 'left-right'])
              .optional()
              .describe('Which edges carry the sprocket bands.'),
            color: z
              .enum(['background', 'black'])
              .optional()
              .describe('Band colour: the canvas background or black.'),
            width: z
              .number()
              .min(MIN_COMPOSITION_SPROCKET_WIDTH)
              .max(MAX_COMPOSITION_SPROCKET_WIDTH)
              .optional()
              .describe(
                `Band width in px (${MIN_COMPOSITION_SPROCKET_WIDTH} to ${MAX_COMPOSITION_SPROCKET_WIDTH}); it is added outside the frames, so the output grows by twice this.`
              ),
            text: z
              .string()
              .max(MAX_COMPOSITION_SPROCKET_TEXT_LENGTH)
              .optional()
              .describe(
                `Edge-code text printed on the band, up to ${MAX_COMPOSITION_SPROCKET_TEXT_LENGTH} characters.`
              ),
            textColor: z
              .string()
              .regex(
                new RegExp(
                  `^(${Object.keys(COMPOSITION_SPROCKET_TEXT_COLORS).join('|')}|#[0-9a-fA-F]{6})$`
                )
              )
              .optional()
              .describe('Edge-code colour: #RRGGBB, or one of amber, white, black.')
          })
          .optional()
          .describe('Film sprocket band settings.'),
        filmTexture: z.boolean().optional().describe('Add film grain texture. Default false.'),
        format: z.enum(['jpeg', 'png']).default('jpeg').describe('Output format. Default jpeg.'),
        quality: qualityFor(0.92).describe('JPEG quality, 0 to 1. Default 0.92.'),
        output: z
          .string()
          .optional()
          .describe(
            'Output file path ending in .jpg/.jpeg or .png to match format. Default: film-x-layout.<jpg|png> next to the first photo.'
          ),
        overwrite: overwriteSchema,
        preview: previewSchema
      },
      annotations: { title: 'Compose a film layout', ...WRITES_FILES }
    },
    async (args) => {
      try {
        if (args.canvasWidth !== undefined && args.canvasHeight !== undefined) {
          throw new UserError('Give at most one of canvasWidth and canvasHeight.')
        }
        const inputs = await Promise.all(args.paths.map((value) => resolveInput(value)))
        if (new Set(inputs.map((file) => file.path)).size !== inputs.length) {
          throw new UserError('The same photo was given twice; give two different files.')
        }
        const format = args.format
        const target = args.output
          ? resolveExplicitOutput(args.output, format)
          : path.join(
              path.dirname((inputs[0] as { path: string }).path),
              defaultOutputName('film-x-layout', '', format)
            )
        await checkOutputs(
          [target],
          inputs.map((file) => file.path),
          args.overwrite
        )
        await ensureDir(path.dirname(target))

        const settings: Record<string, unknown> = {
          frameFormat: args.frameFormat,
          layoutDirection: args.layoutDirection,
          ...ratioSettings(args.ratio),
          ...(args.canvasWidth !== undefined
            ? { canvasSizeMode: 'manual', canvasSizeAnchor: 'width', canvasWidth: args.canvasWidth }
            : args.canvasHeight !== undefined
              ? {
                  canvasSizeMode: 'manual',
                  canvasSizeAnchor: 'height',
                  canvasHeight: args.canvasHeight
                }
              : { canvasSizeMode: 'auto' }),
          padding:
            typeof args.padding === 'number'
              ? { top: args.padding, right: args.padding, bottom: args.padding, left: args.padding }
              : args.padding,
          gap: args.gap,
          background: args.background,
          pattern: args.pattern,
          fit: args.fit,
          filmTexture: args.filmTexture,
          sprocket: args.sprocket && {
            ...args.sprocket,
            textColor: sprocketTextColor(args.sprocket.textColor)
          },
          outputFormat: format,
          outputQuality: args.quality
        }
        const result = await render(ctx, 'compose', (job) => ({
          inputs: inputs.map((file) => job.input(file)),
          settings: stripUndefined(settings),
          output: job.output(target, args.overwrite),
          preview: args.preview ? { maxSide: PREVIEW_MAX_SIDE } : undefined
        }))
        return withPreview(
          {
            output: target,
            format,
            size: pixelSize(result.size),
            settings: result.settings
          },
          result.preview
        )
      } catch (error) {
        return toolError(error)
      }
    }
  )

  const frameSettingsShape = {
    preset: z
      .string()
      .min(1)
      .max(MAX_FRAME_PRESET_LENGTH)
      .optional()
      .describe(
        'A frame preset code starting with "FXF1." copied from the Film X web app (photo frame tool). Applied first; the other options override it.'
      ),
    template: enumOf(templateIds).optional().describe('Frame layout template.'),
    brand: enumOf(brandIds)
      .optional()
      .describe('Camera brand whose logo is shown; "custom" uses a custom logo.'),
    settings: z
      .record(z.unknown())
      .optional()
      .describe(
        'Partial FrameSettings JSON, same shape that frame_preset returns; unknown or invalid values are ignored. ' +
          'Top-level keys: template, ratioMode, ratio, customRatioWidth, customRatioHeight, border, ' +
          'columnSpacing, frameColor, textColor, photoShadow, backdrop, logo, showTagline, tagline, ' +
          'taglineScale, lines, lineScales, text, textScale, sourceType, outputFormat, outputQuality, ' +
          'outputSizeMode, outputLongSide. Call frame_preset to see the full current JSON.'
      )
  }

  server.registerTool(
    'frame_photo',
    {
      title: 'Frame a photo',
      description:
        'Adds a photographic frame (Polaroid, gallery mat, film strip, caption bar and so on) to a ' +
        "photo, with the camera brand logo and a caption built from the photo's EXIF " +
        '(camera, lens, film, focal length, aperture, shutter, ISO, date). The look comes from ' +
        'a preset code copied from the Film X web app, a template and brand, and/or partial ' +
        'settings; call frame_preset first to preview the resolved settings. By default the ' +
        "output keeps the photo's original size (long side capped at " +
        `${MAX_FRAME_CANVAS_SIDE} px) and is written as <name>-frame.<jpg|png> next to the ` +
        'photo. Returns the output path, pixel size, resolved settings summary, caption fields ' +
        'and the preset code for the web app.',
      inputSchema: {
        path: z.string().min(1).describe('Absolute path of the photo, or one starting with "~/".'),
        ...frameSettingsShape,
        fields: z
          .object(
            Object.fromEntries(
              FRAME_INFO_FIELDS.map((field) => [
                field,
                z
                  .string()
                  .max(MAX_FRAME_TEXT_LENGTH)
                  .optional()
                  .describe(
                    `Caption text for "${field}" (up to ${MAX_FRAME_TEXT_LENGTH} characters).`
                  )
              ])
            ) as Record<FrameInfoField, z.ZodOptional<z.ZodString>>
          )
          .optional()
          .describe('Caption text overrides; they win over EXIF-derived values.'),
        autoExif: z
          .boolean()
          .default(true)
          .describe(
            'Fill the caption, brand and film/digital type from the photo EXIF. Default true.'
          ),
        customLogoPath: z
          .string()
          .optional()
          .describe('Absolute path of an image to use as the logo (with brand "custom").'),
        format: z
          .enum(['jpeg', 'png'])
          .optional()
          .describe('Output format. Default: from the preset, else jpeg.'),
        quality: z.number().min(0).max(1).optional().describe('JPEG quality, 0 to 1.'),
        outputLongSide: z
          .number()
          .int()
          .min(MIN_FRAME_OUTPUT_SIDE)
          .max(MAX_FRAME_CANVAS_SIDE)
          .optional()
          .describe(
            `Resize so the output long side is this many px (${MIN_FRAME_OUTPUT_SIDE} to ${MAX_FRAME_CANVAS_SIDE}); the photo is never upscaled past it. Omit to keep the original size.`
          ),
        output: z
          .string()
          .optional()
          .describe(
            'Output file path (.jpg/.jpeg/.png). Default: <name>-frame.<jpg|png> next to the photo.'
          ),
        overwrite: overwriteSchema,
        preview: previewSchema
      },
      annotations: { title: 'Frame a photo', ...WRITES_FILES }
    },
    async (args) => {
      try {
        const input = await resolveInput(args.path)
        const logo = args.customLogoPath
          ? await resolveInput(args.customLogoPath, 'custom logo path')
          : undefined
        const settings: Record<string, unknown> = { ...args.settings }
        if (args.quality !== undefined) settings.outputQuality = args.quality
        if (args.outputLongSide !== undefined) {
          settings.outputSizeMode = 'custom'
          settings.outputLongSide = args.outputLongSide
        }

        let format = args.format
        if (!format && args.output) {
          const fromExtension = formatFromExtension(args.output)
          if (fromExtension !== 'jpeg' && fromExtension !== 'png') {
            throw new UserError(
              `The output path "${args.output}" must end in .jpg, .jpeg or .png for a framed photo.`
            )
          }
          format = fromExtension
        }
        if (!format && (settings.outputFormat === 'jpeg' || settings.outputFormat === 'png')) {
          format = settings.outputFormat
        }
        if (!format) {
          const resolved = await render(ctx, 'framePreset', () => ({
            preset: args.preset,
            template: args.template,
            brand: args.brand,
            settings: stripUndefined(settings)
          }))
          format = resolved.settings.outputFormat
        }
        settings.outputFormat = format

        const target = args.output
          ? resolveExplicitOutput(args.output, format)
          : path.join(path.dirname(input.path), defaultOutputName(input.name, '-frame', format))
        await checkOutputs([target], [input.path, ...(logo ? [logo.path] : [])], args.overwrite)
        await ensureDir(path.dirname(target))

        const result = await render(ctx, 'frame', (job) => ({
          input: job.input(input),
          customLogo: logo && job.input(logo),
          preset: args.preset,
          template: args.template,
          brand: args.brand,
          settings: stripUndefined(settings),
          autoExif: args.autoExif,
          fields: args.fields && stripUndefined(args.fields),
          output: job.output(target, args.overwrite),
          preview: args.preview ? { maxSide: PREVIEW_MAX_SIDE } : undefined
        }))
        const resolved = result.settings
        return withPreview(
          {
            output: target,
            format,
            size: pixelSize(result.size),
            template: resolved.template,
            brand: resolved.logo.brand,
            sourceType: resolved.sourceType,
            outputSizeMode: resolved.outputSizeMode,
            fields: result.fields,
            exif: result.exif,
            presetCode: result.presetCode
          },
          result.preview
        )
      } catch (error) {
        return toolError(error)
      }
    }
  )

  server.registerTool(
    'frame_preset',
    {
      title: 'Resolve frame settings',
      description:
        'Resolves photo-frame settings without touching any image: applies an optional preset code, ' +
        'template, brand and partial settings on top of the defaults, and returns the complete ' +
        'FrameSettings JSON plus the "FXF1." preset code the user can paste into the Film X web ' +
        'app. Use it to learn the available settings before calling frame_photo.',
      inputSchema: frameSettingsShape,
      annotations: { title: 'Resolve frame settings', ...READ_ONLY }
    },
    async (args) => {
      try {
        const result = await render(ctx, 'framePreset', () => ({
          preset: args.preset,
          template: args.template,
          brand: args.brand,
          settings: args.settings
        }))
        return { content: [json(result)] }
      } catch (error) {
        return toolError(error)
      }
    }
  )
}

const stripUndefined = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))

const sprocketTextColor = (value: string | undefined) =>
  value === undefined
    ? undefined
    : (COMPOSITION_SPROCKET_TEXT_COLORS[value as keyof typeof COMPOSITION_SPROCKET_TEXT_COLORS] ??
      value)

const ratioSettings = (ratio: string): Record<string, unknown> => {
  if (ratio === 'auto') return { ratioMode: 'auto' }
  const [width = 0, height = 0] = ratio.split(':').map(Number)
  const value = width / height
  if (!Number.isFinite(value) || value < MIN_CANVAS_RATIO || value > MAX_CANVAS_RATIO) {
    throw new UserError(
      `The ratio "${ratio}" is out of range: W/H must be between ${MIN_CANVAS_RATIO} and ${MAX_CANVAS_RATIO}.`
    )
  }
  const preset = CANVAS_RATIO_PRESETS.find((item) => Math.abs(item.value - value) < 1e-6)
  return preset
    ? { ratioMode: 'preset', ratio: preset.value }
    : { ratioMode: 'custom', customRatioWidth: width, customRatioHeight: height }
}
