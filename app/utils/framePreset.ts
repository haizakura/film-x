import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate'
import { MAX_CANVAS_RATIO, MAX_CANVAS_RATIO_TERM, MIN_CANVAS_RATIO } from '~/types/canvas'
import {
  FRAME_FONTS,
  FRAME_INFO_LINES,
  FRAME_SHADOW_PRESETS,
  FRAME_TEMPLATES,
  MAX_FRAME_BACKDROP_PADDING,
  MAX_FRAME_BORDER,
  MAX_FRAME_CAPTION_COLUMN,
  MAX_FRAME_COLUMN_GAP,
  MAX_FRAME_LETTER_SPACING,
  MAX_FRAME_PRESET_LENGTH,
  MAX_FRAME_SCALE,
  MAX_FRAME_SHADOW_INTENSITY,
  MAX_FRAME_TEXT_LENGTH,
  MIN_FRAME_SCALE
} from '~/types/frame'
import type {
  FrameBorder,
  FrameFontId,
  FrameLogoColorMode,
  FrameLogoSettings,
  FrameLogoStyle,
  FrameOutputSizeMode,
  FramePreset,
  FrameSettings,
  FrameShadow,
  FrameShadowPreset,
  FrameSourceType,
  FrameTemplate,
  FrameTypography
} from '~/types/frame'
import { MAX_EXPORT_QUALITY, MIN_EXPORT_QUALITY } from '~/types/image'
import { CAMERA_BRANDS, getCameraBrand } from '~/utils/cameraBrands'
import { AppError } from '~/utils/errors'
import { clampFrameOutputSide } from '~/utils/photoFrame'
import {
  color,
  flag,
  isRecord,
  number,
  OUTPUT_FORMATS,
  options,
  pick,
  RATIO_MODES,
  record
} from '~/utils/settingsSanitize'
import type { Raw } from '~/utils/settingsSanitize'

// A preset code is "FXF<version>." followed by deflated JSON in base64url, so it stays short and
// survives being pasted into chats and URLs. The version lets later formats migrate old codes.
const PRESET_VERSION = 1
const PRESET_PATTERN = /^FXF(\d+)\.([\w-]+)$/

const TEMPLATES = Object.keys(FRAME_TEMPLATES) as FrameTemplate[]
const SHADOW_PRESETS = Object.keys(FRAME_SHADOW_PRESETS) as FrameShadowPreset[]
const FONTS = Object.keys(FRAME_FONTS) as FrameFontId[]
const BRANDS = CAMERA_BRANDS.map((brand) => brand.id)
const LOGO_STYLES = options<FrameLogoStyle>({
  mark: true,
  wordmark: true,
  custom: true,
  none: true
})
const LOGO_COLOR_MODES = options<FrameLogoColorMode>({ original: true, text: true, custom: true })
const SOURCE_TYPES = options<FrameSourceType>({ digital: true, film: true })
const OUTPUT_SIZE_MODES = options<FrameOutputSizeMode>({ original: true, custom: true })
const BORDER_EDGES = options<keyof FrameBorder>({
  top: true,
  right: true,
  bottom: true,
  left: true
})

const text = (value: unknown, fallback: string) =>
  typeof value === 'string' ? value.slice(0, MAX_FRAME_TEXT_LENGTH) : fallback
const scale = (value: unknown, fallback: number) =>
  number(value, MIN_FRAME_SCALE, MAX_FRAME_SCALE, fallback)

const readTypography = (
  value: unknown,
  base: FrameTypography,
  maxSpacing: number
): FrameTypography => {
  const raw = record(value)
  return {
    font: pick(raw.font, FONTS, base.font),
    bold: flag(raw.bold, base.bold),
    italic: flag(raw.italic, base.italic),
    letterSpacing: number(raw.letterSpacing, 0, maxSpacing, base.letterSpacing),
    uppercase: flag(raw.uppercase, base.uppercase)
  }
}

const readShadow = (value: unknown, base: FrameShadow): FrameShadow => {
  const raw = record(value)
  return {
    preset: pick(raw.preset, SHADOW_PRESETS, base.preset),
    intensity: number(raw.intensity, 0, MAX_FRAME_SHADOW_INTENSITY, base.intensity)
  }
}

const readLogo = (value: unknown, base: FrameLogoSettings): FrameLogoSettings => {
  const raw = record(value)
  const brand = getCameraBrand(pick(raw.brand, BRANDS, base.brand))
  // A mark only belongs to its own brand; fall back to that brand's first one.
  const mark =
    brand.marks.find((option) => option.id === raw.mark)?.id ??
    (brand.id === base.brand ? base.mark : (brand.marks[0]?.id ?? ''))
  const style = pick(raw.style, LOGO_STYLES, base.style)
  return {
    brand: brand.id,
    style: style === 'mark' && !mark ? 'wordmark' : style,
    mark,
    wordmark: text(raw.wordmark, base.wordmark),
    typography: readTypography(raw.typography, base.typography, MAX_FRAME_LETTER_SPACING),
    colorMode: pick(raw.colorMode, LOGO_COLOR_MODES, base.colorMode),
    color: color(raw.color, base.color),
    scale: scale(raw.scale, base.scale)
  }
}

/** Builds a complete preset from untrusted data; missing or invalid values keep the base. */
const readPreset = (raw: Raw, base: FrameSettings): FramePreset => {
  const template = pick(raw.template, TEMPLATES, base.template)
  const { placement } = FRAME_TEMPLATES[template]
  const rawBorder = record(raw.border)
  const border = { ...base.border }
  for (const edge of BORDER_EDGES) {
    const max = edge === placement ? MAX_FRAME_CAPTION_COLUMN : MAX_FRAME_BORDER
    border[edge] = number(rawBorder[edge], 0, max, Math.min(max, base.border[edge]))
  }
  const rawSpacing = record(raw.columnSpacing)
  const rawBackdrop = record(raw.backdrop)
  const rawLines = record(raw.lines)
  const rawLineScales = record(raw.lineScales)
  return {
    template,
    ratioMode: pick(raw.ratioMode, RATIO_MODES, base.ratioMode),
    ratio: number(raw.ratio, MIN_CANVAS_RATIO, MAX_CANVAS_RATIO, base.ratio),
    customRatioWidth: number(raw.customRatioWidth, 1, MAX_CANVAS_RATIO_TERM, base.customRatioWidth),
    customRatioHeight: number(
      raw.customRatioHeight,
      1,
      MAX_CANVAS_RATIO_TERM,
      base.customRatioHeight
    ),
    border,
    columnSpacing: {
      photo: number(rawSpacing.photo, 0, MAX_FRAME_COLUMN_GAP, base.columnSpacing.photo),
      text: number(rawSpacing.text, 0, MAX_FRAME_COLUMN_GAP, base.columnSpacing.text),
      logo: number(rawSpacing.logo, 0, MAX_FRAME_COLUMN_GAP, base.columnSpacing.logo),
      group: number(rawSpacing.group, 0, MAX_FRAME_COLUMN_GAP, base.columnSpacing.group)
    },
    frameColor: color(raw.frameColor, base.frameColor),
    textColor: color(raw.textColor, base.textColor),
    photoShadow: readShadow(raw.photoShadow, base.photoShadow),
    backdrop: {
      enabled: flag(rawBackdrop.enabled, base.backdrop.enabled),
      color: color(rawBackdrop.color, base.backdrop.color),
      padding: number(rawBackdrop.padding, 0, MAX_FRAME_BACKDROP_PADDING, base.backdrop.padding),
      shadow: readShadow(rawBackdrop.shadow, base.backdrop.shadow)
    },
    logo: readLogo(raw.logo, base.logo),
    showTagline: flag(raw.showTagline, base.showTagline),
    taglineScale: scale(raw.taglineScale, base.taglineScale),
    lines: Object.fromEntries(
      FRAME_INFO_LINES.map((line) => [line, flag(rawLines[line], base.lines[line])])
    ) as FramePreset['lines'],
    lineScales: Object.fromEntries(
      FRAME_INFO_LINES.map((line) => [line, scale(rawLineScales[line], base.lineScales[line])])
    ) as FramePreset['lineScales'],
    text: readTypography(raw.text, base.text, MAX_FRAME_LETTER_SPACING / 2),
    textScale: scale(raw.textScale, base.textScale),
    sourceType: pick(raw.sourceType, SOURCE_TYPES, base.sourceType),
    outputFormat: pick(raw.outputFormat, OUTPUT_FORMATS, base.outputFormat),
    outputSizeMode: pick(raw.outputSizeMode, OUTPUT_SIZE_MODES, base.outputSizeMode),
    outputLongSide:
      typeof raw.outputLongSide === 'number'
        ? (clampFrameOutputSide(raw.outputLongSide) ?? base.outputLongSide)
        : base.outputLongSide
  }
}

/** Complete settings from untrusted data via the preset reader, plus the two fields presets omit. */
export const sanitizeFrameSettings = (raw: unknown, base: FrameSettings): FrameSettings => {
  const source = record(raw)
  return {
    ...readPreset(source, base),
    tagline: text(source.tagline, base.tagline),
    outputQuality: number(
      source.outputQuality,
      MIN_EXPORT_QUALITY,
      MAX_EXPORT_QUALITY,
      base.outputQuality
    )
  }
}

const toBase64Url = (bytes: Uint8Array) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

const fromBase64Url = (value: string) => {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

/** Encodes the adjustable settings; caption text and the photo are never included. */
export const encodeFramePreset = (settings: FrameSettings) => {
  const json = JSON.stringify(readPreset({ ...settings }, settings))
  return `FXF${PRESET_VERSION}.${toBase64Url(deflateSync(strToU8(json), { level: 9 }))}`
}

/** Decodes a preset code against the current settings; throws an AppError when unreadable. */
export const decodeFramePreset = (code: string, base: FrameSettings): FramePreset => {
  const compact = code.replace(/\s+/g, '')
  const match = compact.length <= MAX_FRAME_PRESET_LENGTH && PRESET_PATTERN.exec(compact)
  if (!match) throw new AppError('framePresetInvalid')
  if (Number(match[1]) !== PRESET_VERSION) throw new AppError('framePresetUnsupported')
  let raw: unknown
  try {
    raw = JSON.parse(strFromU8(inflateSync(fromBase64Url(match[2] ?? ''))))
  } catch {
    throw new AppError('framePresetInvalid')
  }
  if (!isRecord(raw)) throw new AppError('framePresetInvalid')
  return readPreset(raw, base)
}
