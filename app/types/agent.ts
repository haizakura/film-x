import type { CompositionSettings } from '~/types/composition'
import type {
  CameraBrandId,
  FrameInfoFields,
  FrameSettings,
  FrameSourceType,
  FrameTemplate
} from '~/types/frame'
import type { ExportFormat, Rotation, SplitDetectionResult } from '~/types/image'
import type { PhotoExif } from '~/utils/exif'

/**
 * Contract between the local MCP server (packages/mcp) and the renderer page the deployed site
 * serves at AGENT_RENDERER_PATH. The server proxies the site through a loopback port, so the
 * page and its inputs and outputs share one origin and image bytes never leave the computer.
 * Requests and responses cross `page.evaluate`, so they must stay JSON-serialisable.
 */

/** Bumped on any incompatible change, so a server and a deployed site that disagree fail clearly. */
export const AGENT_RENDERER_PROTOCOL = 1

/** Renderer page route, relative to the site's base URL. */
export const AGENT_RENDERER_PATH = 'mcp-renderer'

/** Loopback-only path prefix for job files; the proxy never forwards it to the site. */
export const AGENT_BRIDGE_PREFIX = '__film-x-mcp'

/** A source file the page fetches with GET from the loopback bridge. */
export interface InputRef {
  url: string
  name: string
}

/** A destination the page POSTs encoded bytes to on the loopback bridge. */
export interface OutputRef {
  url: string
}

export interface PreviewOptions {
  /** Long side of the JPEG preview returned inline; omit to skip the preview. */
  maxSide: number
}

export interface PixelSize {
  width: number
  height: number
}

export interface SplitRequest {
  input: InputRef
  /** Both omitted: detect the split; otherwise the given values replace the detected ones. */
  center?: number
  gap?: number
  leftRotation: Rotation
  rightRotation: Rotation
  format: ExportFormat
  quality: number
  outputs: [OutputRef, OutputRef]
  preview?: PreviewOptions
}

export interface SplitResponse {
  source: PixelSize
  detection?: SplitDetectionResult
  center: number
  gap: number
  crops: [PixelSize, PixelSize]
  /** Base64 JPEG of both halves side by side. */
  preview?: string
}

export interface ComposeRequest {
  /** One or two images; the frame count follows their number. */
  inputs: InputRef[]
  /** Untrusted partial CompositionSettings, sanitised in the page against the defaults. */
  settings: Record<string, unknown>
  output: OutputRef
  preview?: PreviewOptions
}

export interface ComposeResponse {
  size: PixelSize
  settings: CompositionSettings
  preview?: string
}

export interface FrameSettingsRequest {
  /** `FXF1.` code from the web app, applied before the other overrides. */
  preset?: string
  template?: FrameTemplate
  brand?: CameraBrandId
  /** Untrusted partial FrameSettings, sanitised with the preset reader. */
  settings?: Record<string, unknown>
}

export interface FrameRequest extends FrameSettingsRequest {
  input: InputRef
  customLogo?: InputRef
  /** Fill caption fields, brand and source type from the photo's EXIF like the web app. */
  autoExif: boolean
  fields?: Partial<FrameInfoFields>
  output: OutputRef
  preview?: PreviewOptions
}

export interface FrameResponse {
  size: PixelSize
  settings: FrameSettings
  fields: FrameInfoFields
  presetCode: string
  exif?: PhotoExif
  preview?: string
}

export interface ExifRequest {
  input: InputRef
}

export interface ExifResponse {
  exif?: PhotoExif
  brand?: CameraBrandId
  sourceType?: FrameSourceType
  fields: FrameInfoFields
}

export interface FramePresetResponse {
  settings: FrameSettings
  presetCode: string
}

export interface FilmXRenderer {
  protocol: number
  split: (request: SplitRequest) => Promise<SplitResponse>
  compose: (request: ComposeRequest) => Promise<ComposeResponse>
  frame: (request: FrameRequest) => Promise<FrameResponse>
  readExif: (request: ExifRequest) => Promise<ExifResponse>
  framePreset: (request: FrameSettingsRequest) => Promise<FramePresetResponse>
}

export type RendererMethod = Exclude<keyof FilmXRenderer, 'protocol'>

export type RendererRequest<M extends RendererMethod> = Parameters<FilmXRenderer[M]>[0]

export type RendererResponse<M extends RendererMethod> = Awaited<ReturnType<FilmXRenderer[M]>>

declare global {
  interface Window {
    filmX?: FilmXRenderer
  }
}
