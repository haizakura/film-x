import { MAX_COMPOSITION_CANVAS_SIDE } from '~/types/composition'
import type { DecodedImage } from '~/types/image'

// Frames share the composer's canvas budget so exports stay within browser canvas limits.
export const MAX_FRAME_CANVAS_SIDE = MAX_COMPOSITION_CANVAS_SIDE
export const FRAME_PREVIEW_SIDE = 2000
export const MAX_FRAME_BORDER = 0.6
/** Side captions hold the logo and text, so their column may grow wider than a plain border. */
export const MAX_FRAME_CAPTION_COLUMN = 1
export const MAX_FRAME_BACKDROP_PADDING = 0.4
export const MAX_FRAME_COLUMN_GAP = 0.3
export const MAX_FRAME_TEXT_LENGTH = 80
export const MIN_FRAME_SCALE = 0.5
export const MAX_FRAME_SCALE = 2
export const MAX_FRAME_SHADOW_INTENSITY = 1.5
export const MAX_FRAME_LETTER_SPACING = 0.8
/** Bounds of a custom output long side, in pixels; the upper bound is the canvas budget. */
export const MIN_FRAME_OUTPUT_SIDE = 256
export const DEFAULT_FRAME_OUTPUT_SIDE = 4096
// Layout used for the empty preview before a photo is imported (a 3:2 frame).
export const FRAME_PLACEHOLDER_SIZE = { width: 3000, height: 2000 } as const

export type FrameTemplate =
  | 'polaroid'
  | 'gallery'
  | 'float'
  | 'strip'
  | 'bar'
  | 'photoLeft'
  | 'photoRight'
  | 'column'
export type FrameTextLayout = 'stack' | 'split' | 'bar' | 'column'
/** Edge of the card that holds the caption. */
export type FrameCaptionPlacement = 'bottom' | 'left' | 'right'
export type FrameShadowPreset =
  | 'none'
  | 'contact'
  | 'soft'
  | 'lifted'
  | 'ambient'
  | 'deep'
  | 'directional'
  | 'hard'
export type FrameOutputFormat = 'jpeg' | 'png'
export type FrameOutputSizeMode = 'original' | 'custom'
export type FrameSourceType = 'digital' | 'film'
export type FrameLogoStyle = 'mark' | 'wordmark' | 'custom' | 'none'
export type FrameLogoColorMode = 'original' | 'text' | 'custom'
export type FrameFontCategory = 'serif' | 'sans' | 'mono' | 'script' | 'system'
export type FrameFontId =
  | 'playfair'
  | 'bodoni'
  | 'cormorant'
  | 'dm-serif'
  | 'cinzel'
  | 'italiana'
  | 'jost'
  | 'josefin'
  | 'montserrat'
  | 'syncopate'
  | 'michroma'
  | 'orbitron'
  | 'bebas'
  | 'plex-mono'
  | 'courier'
  | 'great-vibes'
  | 'dancing'
  | 'caveat'
  | 'system-sans'
  | 'system-serif'
  | 'system-kai'
export type FrameWordmarkPreset =
  | 'classic'
  | 'roman'
  | 'geometric'
  | 'heavy'
  | 'wide'
  | 'script'
  | 'mono'
export type FrameInfoField =
  | 'camera'
  | 'lens'
  | 'film'
  | 'focalLength'
  | 'aperture'
  | 'shutter'
  | 'iso'
  | 'date'
  | 'custom'
export type FrameInfoLine = 'camera' | 'lens' | 'film' | 'exposure' | 'date' | 'custom'
export type CameraBrandId =
  | 'hasselblad'
  | 'leica'
  | 'nikon'
  | 'canon'
  | 'sony'
  | 'fujifilm'
  | 'olympus'
  | 'om-system'
  | 'panasonic'
  | 'pentax'
  | 'ricoh'
  | 'sigma'
  | 'zeiss'
  | 'mamiya'
  | 'contax'
  | 'minolta'
  | 'konica'
  | 'rollei'
  | 'voigtlander'
  | 'yashica'
  | 'bronica'
  | 'phase-one'
  | 'linhof'
  | 'kodak'
  | 'polaroid'
  | 'lomography'
  | 'ilford'
  | 'agfa'
  | 'apple'
  | 'samsung'
  | 'google'
  | 'xiaomi'
  | 'huawei'
  | 'oppo'
  | 'vivo'
  | 'honor'
  | 'oneplus'
  | 'dji'
  | 'gopro'
  | 'insta360'
  | 'custom'

export const FRAME_INFO_FIELDS: readonly FrameInfoField[] = [
  'camera',
  'lens',
  'film',
  'focalLength',
  'aperture',
  'shutter',
  'iso',
  'date',
  'custom'
]
export const FRAME_INFO_LINES: readonly FrameInfoLine[] = [
  'camera',
  'lens',
  'film',
  'exposure',
  'date',
  'custom'
]

export type FrameInfoFields = Record<FrameInfoField, string>
export type FrameInfoLines = Record<FrameInfoLine, boolean>

export interface FrameTypography {
  font: FrameFontId
  bold: boolean
  italic: boolean
  /** Extra tracking in em. */
  letterSpacing: number
  uppercase: boolean
}

/** Border widths as fractions of the photo unit (geometric mean of its sides). */
export interface FrameBorder {
  top: number
  right: number
  bottom: number
  left: number
}

/** Gaps of the column layout as fractions of the photo unit. */
export interface FrameColumnSpacing {
  /** Photo edge to the rule. */
  photo: number
  /** Rule to the caption text. */
  text: number
  /** Logo to the first caption group. */
  logo: number
  /** Between the caption groups. */
  group: number
}

export const DEFAULT_FRAME_COLUMN_SPACING: FrameColumnSpacing = {
  photo: 0.06,
  text: 0.06,
  logo: 0.025,
  group: 0.02
}

export interface FrameShadow {
  preset: FrameShadowPreset
  intensity: number
}

export interface FrameBackdrop {
  enabled: boolean
  color: string
  padding: number
  shadow: FrameShadow
}

export interface FrameLogoSettings {
  brand: CameraBrandId
  style: FrameLogoStyle
  mark: string
  wordmark: string
  typography: FrameTypography
  colorMode: FrameLogoColorMode
  color: string
  scale: number
}

export interface FrameSettings {
  template: FrameTemplate
  border: FrameBorder
  columnSpacing: FrameColumnSpacing
  frameColor: string
  textColor: string
  photoShadow: FrameShadow
  backdrop: FrameBackdrop
  logo: FrameLogoSettings
  showTagline: boolean
  tagline: string
  lines: FrameInfoLines
  text: FrameTypography
  textScale: number
  sourceType: FrameSourceType
  outputFormat: FrameOutputFormat
  outputQuality: number
  outputSizeMode: FrameOutputSizeMode
  /** Requested long side of the custom output; the photo is never upscaled past it. */
  outputLongSide: number
}

export interface FramePhoto {
  name: string
  decoded: DecodedImage
}

export interface FrameRect {
  x: number
  y: number
  width: number
  height: number
}

export interface FrameLayout {
  /** Reference length for all relative sizes, in source photo pixels. */
  unit: number
  width: number
  height: number
  card: FrameRect
  photo: FrameRect
}

export interface FrameTemplateSpec {
  layout: FrameTextLayout
  placement: FrameCaptionPlacement
  border: FrameBorder
  /** Logo height, tagline and caption sizes as fractions of the photo unit. */
  logoHeight: number
  taglineSize: number
  textSize: number
  photoShadow: FrameShadowPreset
  backdrop: boolean
  showTagline: boolean
  showInfo: boolean
}

export const FRAME_TEMPLATES: Record<FrameTemplate, FrameTemplateSpec> = {
  polaroid: {
    layout: 'stack',
    placement: 'bottom',
    border: { top: 0.035, right: 0.035, bottom: 0.2, left: 0.035 },
    logoHeight: 0.034,
    taglineSize: 0.013,
    textSize: 0.015,
    photoShadow: 'none',
    backdrop: false,
    showTagline: false,
    showInfo: false
  },
  gallery: {
    layout: 'stack',
    placement: 'bottom',
    border: { top: 0.08, right: 0.08, bottom: 0.3, left: 0.08 },
    logoHeight: 0.03,
    taglineSize: 0.012,
    textSize: 0.0135,
    photoShadow: 'contact',
    backdrop: true,
    showTagline: true,
    showInfo: true
  },
  float: {
    layout: 'stack',
    placement: 'bottom',
    border: { top: 0.15, right: 0.085, bottom: 0.21, left: 0.085 },
    logoHeight: 0.032,
    taglineSize: 0.0125,
    textSize: 0.014,
    photoShadow: 'ambient',
    backdrop: false,
    showTagline: true,
    showInfo: false
  },
  strip: {
    layout: 'split',
    placement: 'bottom',
    border: { top: 0, right: 0, bottom: 0.12, left: 0 },
    logoHeight: 0.03,
    taglineSize: 0.012,
    textSize: 0.017,
    photoShadow: 'none',
    backdrop: false,
    showTagline: false,
    showInfo: true
  },
  bar: {
    layout: 'bar',
    placement: 'bottom',
    border: { top: 0, right: 0, bottom: 0.12, left: 0 },
    logoHeight: 0.034,
    taglineSize: 0.012,
    textSize: 0.016,
    photoShadow: 'none',
    backdrop: false,
    showTagline: false,
    showInfo: true
  },
  // Side columns are narrow, so they get a wide caption edge and slightly smaller text.
  photoLeft: {
    layout: 'stack',
    placement: 'right',
    border: { top: 0.06, right: 0.42, bottom: 0.06, left: 0.06 },
    logoHeight: 0.03,
    taglineSize: 0.0115,
    textSize: 0.013,
    photoShadow: 'none',
    backdrop: false,
    showTagline: true,
    showInfo: true
  },
  photoRight: {
    layout: 'stack',
    placement: 'left',
    border: { top: 0.06, right: 0.06, bottom: 0.06, left: 0.42 },
    logoHeight: 0.03,
    taglineSize: 0.0115,
    textSize: 0.013,
    photoShadow: 'none',
    backdrop: false,
    showTagline: true,
    showInfo: true
  },
  column: {
    layout: 'column',
    placement: 'right',
    border: { top: 0.06, right: 0.55, bottom: 0.06, left: 0.06 },
    logoHeight: 0.032,
    taglineSize: 0.012,
    textSize: 0.016,
    photoShadow: 'none',
    backdrop: false,
    showTagline: false,
    showInfo: true
  }
}

export interface FrameShadowLayer {
  /** Blur and offsets as fractions of the photo unit. */
  blur: number
  offsetX: number
  offsetY: number
  alpha: number
}

// Layered presets combine a tight contact shadow with a broad soft one, like real paper.
export const FRAME_SHADOW_PRESETS: Record<FrameShadowPreset, FrameShadowLayer[]> = {
  none: [],
  contact: [
    { blur: 0.006, offsetX: 0, offsetY: 0.002, alpha: 0.3 },
    { blur: 0.016, offsetX: 0, offsetY: 0.006, alpha: 0.1 }
  ],
  soft: [
    { blur: 0.03, offsetX: 0, offsetY: 0.01, alpha: 0.18 },
    { blur: 0.006, offsetX: 0, offsetY: 0.002, alpha: 0.12 }
  ],
  lifted: [
    { blur: 0.06, offsetX: 0, offsetY: 0.03, alpha: 0.26 },
    { blur: 0.012, offsetX: 0, offsetY: 0.006, alpha: 0.16 }
  ],
  ambient: [
    { blur: 0.09, offsetX: 0, offsetY: 0.014, alpha: 0.3 },
    { blur: 0.02, offsetX: 0, offsetY: 0.004, alpha: 0.1 }
  ],
  deep: [
    { blur: 0.14, offsetX: 0, offsetY: 0.06, alpha: 0.42 },
    { blur: 0.024, offsetX: 0, offsetY: 0.01, alpha: 0.22 }
  ],
  directional: [
    { blur: 0.05, offsetX: 0.035, offsetY: 0.045, alpha: 0.3 },
    { blur: 0.008, offsetX: 0.004, offsetY: 0.005, alpha: 0.14 }
  ],
  hard: [{ blur: 0, offsetX: 0.016, offsetY: 0.016, alpha: 0.85 }]
}

export interface FrameFont {
  /** CSS font-family value, quoted where needed. */
  family: string
  category: FrameFontCategory
  regular: number
  bold?: number
  italic: boolean
}

export const FRAME_FONTS: Record<FrameFontId, FrameFont> = {
  playfair: {
    family: '"Playfair Display"',
    category: 'serif',
    regular: 400,
    bold: 700,
    italic: true
  },
  bodoni: { family: '"Bodoni Moda"', category: 'serif', regular: 400, bold: 700, italic: true },
  cormorant: {
    family: '"Cormorant Garamond"',
    category: 'serif',
    regular: 500,
    bold: 700,
    italic: true
  },
  'dm-serif': { family: '"DM Serif Display"', category: 'serif', regular: 400, italic: true },
  cinzel: { family: '"Cinzel"', category: 'serif', regular: 400, bold: 700, italic: false },
  italiana: { family: '"Italiana"', category: 'serif', regular: 400, italic: false },
  jost: { family: '"Jost"', category: 'sans', regular: 400, bold: 600, italic: true },
  josefin: { family: '"Josefin Sans"', category: 'sans', regular: 400, bold: 600, italic: false },
  montserrat: { family: '"Montserrat"', category: 'sans', regular: 500, bold: 800, italic: false },
  syncopate: { family: '"Syncopate"', category: 'sans', regular: 400, bold: 700, italic: false },
  michroma: { family: '"Michroma"', category: 'sans', regular: 400, italic: false },
  orbitron: { family: '"Orbitron"', category: 'sans', regular: 500, bold: 800, italic: false },
  bebas: { family: '"Bebas Neue"', category: 'sans', regular: 400, italic: false },
  'plex-mono': {
    family: '"IBM Plex Mono"',
    category: 'mono',
    regular: 400,
    bold: 600,
    italic: false
  },
  courier: { family: '"Courier Prime"', category: 'mono', regular: 400, bold: 700, italic: true },
  'great-vibes': { family: '"Great Vibes"', category: 'script', regular: 400, italic: false },
  dancing: {
    family: '"Dancing Script"',
    category: 'script',
    regular: 400,
    bold: 700,
    italic: false
  },
  caveat: { family: '"Caveat"', category: 'script', regular: 400, bold: 700, italic: false },
  'system-sans': {
    family:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", sans-serif',
    category: 'system',
    regular: 400,
    bold: 700,
    italic: true
  },
  'system-serif': {
    family: '"Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", Georgia, serif',
    category: 'system',
    regular: 400,
    bold: 700,
    italic: true
  },
  'system-kai': {
    family: '"Kaiti SC", STKaiti, KaiTi, "Klee One", serif',
    category: 'system',
    regular: 400,
    bold: 700,
    italic: false
  }
}

export const FRAME_WORDMARK_PRESETS: Record<
  FrameWordmarkPreset,
  Omit<FrameTypography, 'uppercase'>
> = {
  classic: { font: 'playfair', bold: true, italic: true, letterSpacing: 0.34 },
  roman: { font: 'cinzel', bold: true, italic: false, letterSpacing: 0.22 },
  geometric: { font: 'jost', bold: false, italic: false, letterSpacing: 0.38 },
  heavy: { font: 'montserrat', bold: true, italic: false, letterSpacing: 0.04 },
  wide: { font: 'syncopate', bold: true, italic: false, letterSpacing: 0.14 },
  script: { font: 'great-vibes', bold: false, italic: false, letterSpacing: 0 },
  mono: { font: 'plex-mono', bold: false, italic: false, letterSpacing: 0.24 }
}

export interface FrameLogoMark {
  /** Asset file stem under app/assets/frame-logos. */
  id: string
  /** Single-colour artwork can be recoloured; multicolour marks keep their own colours. */
  tintable: boolean
}

export interface CameraBrand {
  id: CameraBrandId
  name: string
  wordmarkPreset: FrameWordmarkPreset
  wordmark?: string
  tagline?: string
  marks: FrameLogoMark[]
  /** Matches the normalized EXIF Make (and Model for sub-brands). */
  exifPattern?: RegExp
}

export const clampFrameValue = (value: number, minimum: number, maximum: number) =>
  Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : minimum
