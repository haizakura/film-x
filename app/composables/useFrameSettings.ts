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

/** auto: only while the user has not chosen; force: apply and forget the manual choice. */
export type FrameChoiceSource = 'user' | 'auto' | 'force'

const DEFAULT_TEMPLATE: FrameTemplate = 'gallery'
const DEFAULT_BRAND: CameraBrandId = 'hasselblad'
export const DEFAULT_FRAME_TEXT_COLOR = '#1C1C1C'

const linesFor = (sourceType: FrameSourceType, visible: boolean): FrameInfoLines => ({
  camera: visible,
  lens: visible,
  film: visible && sourceType === 'film',
  exposure: visible && sourceType === 'digital',
  date: false,
  custom: false
})

const wordmarkTypography = (preset: FrameWordmarkPreset) => ({
  ...FRAME_WORDMARK_PRESETS[preset],
  uppercase: preset !== 'script'
})

const brandLogo = (brand: CameraBrand, current?: FrameLogoSettings) => {
  const keepStyle = current?.style === 'custom' || current?.style === 'none'
  return {
    brand: brand.id,
    style: keepStyle && current ? current.style : brand.marks.length ? 'mark' : 'wordmark',
    mark: brand.marks[0]?.id ?? '',
    wordmark: brand.wordmark ?? brand.name.toUpperCase(),
    typography: wordmarkTypography(brand.wordmarkPreset)
  } satisfies Partial<FrameLogoSettings>
}

const createDefaultSettings = (): FrameSettings => {
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
      ...brandLogo(brand),
      colorMode: 'original',
      color: DEFAULT_FRAME_TEXT_COLOR,
      scale: 1
    },
    showTagline: template.showTagline,
    tagline: brand.tagline ?? '',
    taglineScale: 1,
    lines: linesFor('digital', template.showInfo),
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

export const useFrameSettings = () => {
  const settings = ref<FrameSettings>(createDefaultSettings())
  const templateSpec = computed(() => FRAME_TEMPLATES[settings.value.template])
  const brand = computed(() => getCameraBrand(settings.value.logo.brand))
  let brandChosen = false
  let taglineEdited = false
  let sourceChosen = false

  /** Templates are presets: they reset border, shadow and which caption lines are shown. */
  const applyTemplate = (template: FrameTemplate) => {
    const spec = FRAME_TEMPLATES[template]
    const current = settings.value
    current.template = template
    current.border = { ...spec.border }
    current.columnSpacing = { ...DEFAULT_FRAME_COLUMN_SPACING }
    current.photoShadow.preset = spec.photoShadow
    current.backdrop.enabled = spec.backdrop
    current.showTagline = spec.showTagline
    current.lines = linesFor(current.sourceType, spec.showInfo)
  }

  let applyingBrand = false
  // Customising the logo counts as a manual choice, so later photos never overwrite it.
  watch(
    () => {
      const { style, mark, wordmark, typography } = settings.value.logo
      return [style, mark, wordmark, typography]
    },
    () => {
      if (!applyingBrand) brandChosen = true
    },
    { deep: true, flush: 'sync' }
  )

  const selectBrand = (id: CameraBrandId, source: FrameChoiceSource = 'user') => {
    if (source === 'auto' && (brandChosen || id === settings.value.logo.brand)) return
    const next = getCameraBrand(id)
    applyingBrand = true
    Object.assign(settings.value.logo, brandLogo(next, settings.value.logo))
    applyingBrand = false
    brandChosen = source === 'user'
    if (!taglineEdited) settings.value.tagline = next.tagline ?? ''
  }

  const setTagline = (text: string) => {
    taglineEdited = true
    settings.value.tagline = text
  }

  const setSourceType = (type: FrameSourceType, source: FrameChoiceSource = 'user') => {
    if (source === 'auto' && sourceChosen) return
    sourceChosen = source === 'user'
    const current = settings.value
    if (current.sourceType === type) return
    current.sourceType = type
    // Film captions show the stock where digital captions show the exposure.
    if (current.lines.film || current.lines.exposure) {
      current.lines.film = type === 'film'
      current.lines.exposure = type === 'digital'
    }
  }

  const applyWordmarkPreset = (preset: FrameWordmarkPreset) => {
    settings.value.logo.typography = wordmarkTypography(preset)
  }

  return {
    settings,
    templateSpec,
    brand,
    applyTemplate,
    selectBrand,
    setTagline,
    setSourceType,
    applyWordmarkPreset
  }
}

export type FrameSettingsApi = ReturnType<typeof useFrameSettings>
