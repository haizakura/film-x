import {
  DEFAULT_FRAME_COLUMN_SPACING,
  DEFAULT_FRAME_OUTPUT_SIDE,
  FRAME_TEMPLATES,
  FRAME_WORDMARK_PRESETS
} from '~/types/frame'
import type {
  CameraBrand,
  CameraBrandId,
  FrameInfoLines,
  FrameLogoSettings,
  FrameSettings,
  FrameSourceType,
  FrameTemplate,
  FrameWordmarkPreset
} from '~/types/frame'
import { getCameraBrand } from '~/utils/cameraBrands'
import { decodeFramePreset } from '~/utils/framePreset'

export const DEFAULT_TEMPLATE: FrameTemplate = 'gallery'
export const DEFAULT_BRAND: CameraBrandId = 'hasselblad'
export const DEFAULT_FRAME_TEXT_COLOR = '#1C1C1C'

export const getFrameInfoLines = (
  sourceType: FrameSourceType,
  visible: boolean
): FrameInfoLines => ({
  camera: visible,
  lens: visible,
  film: visible && sourceType === 'film',
  exposure: visible && sourceType === 'digital',
  date: false,
  custom: false
})

export const getWordmarkTypography = (preset: FrameWordmarkPreset) => ({
  ...FRAME_WORDMARK_PRESETS[preset],
  uppercase: preset !== 'script'
})

export const getBrandLogo = (brand: CameraBrand, current?: FrameLogoSettings) => {
  const keepStyle = current?.style === 'custom' || current?.style === 'none'
  return {
    brand: brand.id,
    style: keepStyle && current ? current.style : brand.marks.length ? 'mark' : 'wordmark',
    mark: brand.marks[0]?.id ?? '',
    wordmark: brand.wordmark ?? brand.name.toUpperCase(),
    typography: getWordmarkTypography(brand.wordmarkPreset)
  } satisfies Partial<FrameLogoSettings>
}

/** The logo follows the brand, and so does the tagline unless the caller keeps its own. */
export const applyBrand = (settings: FrameSettings, id: CameraBrandId, keepTagline: boolean) => {
  const brand = getCameraBrand(id)
  Object.assign(settings.logo, getBrandLogo(brand, settings.logo))
  if (!keepTagline) settings.tagline = brand.tagline ?? ''
}

export const createDefaultFrameSettings = (): FrameSettings => {
  const template = FRAME_TEMPLATES[DEFAULT_TEMPLATE]
  const brand = getCameraBrand(DEFAULT_BRAND)
  return {
    template: DEFAULT_TEMPLATE,
    ratioMode: 'auto',
    ratio: 4 / 5,
    customRatioWidth: 4,
    customRatioHeight: 5,
    border: { ...template.border },
    columnSpacing: { ...DEFAULT_FRAME_COLUMN_SPACING },
    frameColor: '#FFFFFF',
    textColor: DEFAULT_FRAME_TEXT_COLOR,
    photoShadow: { preset: template.photoShadow, intensity: 1 },
    backdrop: {
      enabled: template.backdrop,
      color: '#ECEAE6',
      padding: 0.12,
      shadow: { preset: 'lifted', intensity: 1 }
    },
    logo: {
      ...getBrandLogo(brand),
      colorMode: 'original',
      color: DEFAULT_FRAME_TEXT_COLOR,
      scale: 1
    },
    showTagline: template.showTagline,
    tagline: brand.tagline ?? '',
    taglineScale: 1,
    lines: getFrameInfoLines('digital', template.showInfo),
    lineScales: { camera: 1, lens: 1, film: 1, exposure: 1, date: 1, custom: 1 },
    text: { font: 'jost', bold: false, italic: false, letterSpacing: 0.02, uppercase: false },
    textScale: 1,
    sourceType: 'digital',
    outputFormat: 'jpeg',
    outputQuality: 0.92,
    outputSizeMode: 'original',
    outputLongSide: DEFAULT_FRAME_OUTPUT_SIDE
  }
}

/** Templates are presets: they reset border, shadow and which caption lines are shown. */
export const applyFrameTemplate = (settings: FrameSettings, template: FrameTemplate) => {
  const spec = FRAME_TEMPLATES[template]
  settings.template = template
  settings.border = { ...spec.border }
  settings.columnSpacing = { ...DEFAULT_FRAME_COLUMN_SPACING }
  settings.photoShadow.preset = spec.photoShadow
  settings.backdrop.enabled = spec.backdrop
  settings.showTagline = spec.showTagline
  settings.lines = getFrameInfoLines(settings.sourceType, spec.showInfo)
}

export const applyFrameSourceType = (settings: FrameSettings, type: FrameSourceType) => {
  if (settings.sourceType === type) return
  settings.sourceType = type
  // Film captions show the stock where digital captions show the exposure.
  if (settings.lines.film || settings.lines.exposure) {
    settings.lines.film = type === 'film'
    settings.lines.exposure = type === 'digital'
  }
}

/** Settings with a preset code applied; the tagline and quality stay, unless the brand changes. */
export const applyPresetCode = (
  settings: FrameSettings,
  code: string,
  keepTagline: boolean
): FrameSettings => {
  const preset = decodeFramePreset(code, settings)
  const next = { ...preset, tagline: settings.tagline, outputQuality: settings.outputQuality }
  if (preset.logo.brand !== settings.logo.brand && !keepTagline) {
    next.tagline = getCameraBrand(preset.logo.brand).tagline ?? ''
  }
  return next
}
