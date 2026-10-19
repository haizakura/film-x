import { MAX_CANVAS_RATIO, MAX_CANVAS_RATIO_TERM, MIN_CANVAS_RATIO } from '~/types/canvas'
import {
  clampCompositionSprocketWidth,
  COMPOSITION_FRAME_FORMATS,
  COMPOSITION_SPROCKET_TEXT_COLORS,
  MAX_COMPOSITION_CANVAS_SIDE,
  MAX_COMPOSITION_GAP,
  MAX_COMPOSITION_PADDING,
  MAX_COMPOSITION_SPROCKET_TEXT_LENGTH
} from '~/types/composition'
import type {
  CompositionCanvasSizeAnchor,
  CompositionCanvasSizeMode,
  CompositionFitMode,
  CompositionFrameCount,
  CompositionFrameFormat,
  CompositionLayoutDirection,
  CompositionPadding,
  CompositionPattern,
  CompositionSettings,
  CompositionSprocketColor,
  CompositionSprocketPlacement,
  CompositionSprocketTextColorPreset
} from '~/types/composition'
import { MAX_EXPORT_QUALITY, MIN_EXPORT_QUALITY } from '~/types/image'
import {
  color,
  find,
  flag,
  number,
  OUTPUT_FORMATS,
  options,
  pick,
  RATIO_MODES,
  record
} from '~/utils/settingsSanitize'

const CANVAS_WIDTH = 2400

/** The settings of a fresh layout before the user changes anything. */
export const createDefaultCompositionSettings = (): CompositionSettings => ({
  frameFormat: 'half',
  frameCount: 2,
  ratioMode: 'auto',
  ratio: 4 / 5,
  customRatioWidth: 4,
  customRatioHeight: 5,
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: Math.round(CANVAS_WIDTH / (4 / 5)),
  canvasSizeAnchor: 'width',
  canvasSizeMode: 'auto',
  layoutDirection: COMPOSITION_FRAME_FORMATS.half.layoutDirection,
  background: '#E9E4DA',
  pattern: 'none',
  sprocket: {
    enabled: false,
    placement: 'top-bottom',
    color: 'background',
    width: 96,
    text: '',
    textColor: COMPOSITION_SPROCKET_TEXT_COLORS.amber
  },
  filmTexture: false,
  fit: 'cover',
  padding: { top: 112, right: 112, bottom: 112, left: 112 },
  gap: 48,
  outputFormat: 'jpeg',
  outputQuality: 0.92
})

const FRAME_FORMATS = Object.keys(COMPOSITION_FRAME_FORMATS) as CompositionFrameFormat[]
const FRAME_COUNTS: readonly CompositionFrameCount[] = [1, 2]
const CANVAS_SIZE_ANCHORS = options<CompositionCanvasSizeAnchor>({ width: true, height: true })
const CANVAS_SIZE_MODES = options<CompositionCanvasSizeMode>({ auto: true, manual: true })
const LAYOUT_DIRECTIONS = options<CompositionLayoutDirection>({ horizontal: true, vertical: true })
const PATTERNS = options<CompositionPattern>({ none: true, grid: true, dots: true })
const FIT_MODES = options<CompositionFitMode>({ cover: true, contain: true })
const SPROCKET_PLACEMENTS = options<CompositionSprocketPlacement>({
  'top-bottom': true,
  'left-right': true
})
const SPROCKET_COLORS = options<CompositionSprocketColor>({ background: true, black: true })
const SPROCKET_TEXT_COLOR_PRESETS = Object.keys(
  COMPOSITION_SPROCKET_TEXT_COLORS
) as CompositionSprocketTextColorPreset[]
const PADDING_EDGES = options<keyof CompositionPadding>({
  top: true,
  right: true,
  bottom: true,
  left: true
})

const integer = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback
const textColor = (value: unknown, fallback: string) => {
  const preset = find(value, SPROCKET_TEXT_COLOR_PRESETS)
  return preset ? COMPOSITION_SPROCKET_TEXT_COLORS[preset] : color(value, fallback)
}

/** Builds complete settings from untrusted data; missing or invalid values keep the base. */
export const sanitizeCompositionSettings = (
  raw: unknown,
  base: CompositionSettings
): CompositionSettings => {
  const source = record(raw)
  const rawSprocket = record(source.sprocket)
  const rawPadding = record(source.padding)

  const frameFormat = pick(source.frameFormat, FRAME_FORMATS, base.frameFormat)
  const rawLayoutDirection = find(source.layoutDirection, LAYOUT_DIRECTIONS)
  // Switching the film format also switches the stacking direction, as the format picker does.
  const layoutDirection =
    rawLayoutDirection ??
    (frameFormat !== base.frameFormat
      ? COMPOSITION_FRAME_FORMATS[frameFormat].layoutDirection
      : base.layoutDirection)

  const padding = { ...base.padding }
  for (const edge of PADDING_EDGES) {
    padding[edge] = integer(rawPadding[edge], 0, MAX_COMPOSITION_PADDING, base.padding[edge])
  }

  return {
    frameFormat,
    frameCount: pick(source.frameCount, FRAME_COUNTS, base.frameCount),
    ratioMode: pick(source.ratioMode, RATIO_MODES, base.ratioMode),
    ratio: number(source.ratio, MIN_CANVAS_RATIO, MAX_CANVAS_RATIO, base.ratio),
    customRatioWidth: integer(
      source.customRatioWidth,
      1,
      MAX_CANVAS_RATIO_TERM,
      base.customRatioWidth
    ),
    customRatioHeight: integer(
      source.customRatioHeight,
      1,
      MAX_CANVAS_RATIO_TERM,
      base.customRatioHeight
    ),
    canvasWidth: integer(source.canvasWidth, 1, MAX_COMPOSITION_CANVAS_SIDE, base.canvasWidth),
    canvasHeight: integer(source.canvasHeight, 1, MAX_COMPOSITION_CANVAS_SIDE, base.canvasHeight),
    canvasSizeAnchor: pick(source.canvasSizeAnchor, CANVAS_SIZE_ANCHORS, base.canvasSizeAnchor),
    canvasSizeMode: pick(source.canvasSizeMode, CANVAS_SIZE_MODES, base.canvasSizeMode),
    layoutDirection,
    background: color(source.background, base.background),
    pattern: pick(source.pattern, PATTERNS, base.pattern),
    sprocket: {
      enabled: flag(rawSprocket.enabled, base.sprocket.enabled),
      placement: pick(rawSprocket.placement, SPROCKET_PLACEMENTS, base.sprocket.placement),
      color: pick(rawSprocket.color, SPROCKET_COLORS, base.sprocket.color),
      width:
        typeof rawSprocket.width === 'number' && Number.isFinite(rawSprocket.width)
          ? clampCompositionSprocketWidth(rawSprocket.width)
          : base.sprocket.width,
      text:
        typeof rawSprocket.text === 'string'
          ? rawSprocket.text.slice(0, MAX_COMPOSITION_SPROCKET_TEXT_LENGTH)
          : base.sprocket.text,
      textColor: textColor(rawSprocket.textColor, base.sprocket.textColor)
    },
    filmTexture: flag(source.filmTexture, base.filmTexture),
    fit: pick(source.fit, FIT_MODES, base.fit),
    padding,
    gap: integer(source.gap, 0, MAX_COMPOSITION_GAP, base.gap),
    outputFormat: pick(source.outputFormat, OUTPUT_FORMATS, base.outputFormat),
    outputQuality: number(
      source.outputQuality,
      MIN_EXPORT_QUALITY,
      MAX_EXPORT_QUALITY,
      base.outputQuality
    )
  }
}
