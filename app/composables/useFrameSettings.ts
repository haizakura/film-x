import { FRAME_TEMPLATES } from '~/types/frame'
import type {
  CameraBrandId,
  FrameSettings,
  FrameSourceType,
  FrameTemplate,
  FrameWordmarkPreset
} from '~/types/frame'
import { getCameraBrand } from '~/utils/cameraBrands'
import { decodeFramePreset, encodeFramePreset } from '~/utils/framePreset'
import {
  applyFrameSourceType,
  applyFrameTemplate,
  createDefaultFrameSettings,
  getBrandLogo,
  getWordmarkTypography
} from '~/utils/frameSettings'

/** auto: only while the user has not chosen; force: apply and forget the manual choice. */
export type FrameChoiceSource = 'user' | 'auto' | 'force'

export const useFrameSettings = () => {
  const settings = ref<FrameSettings>(createDefaultFrameSettings())
  const templateSpec = computed(() => FRAME_TEMPLATES[settings.value.template])
  const brand = computed(() => getCameraBrand(settings.value.logo.brand))
  let brandChosen = false
  let taglineEdited = false
  let sourceChosen = false

  const applyTemplate = (template: FrameTemplate) => {
    applyFrameTemplate(settings.value, template)
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
    Object.assign(settings.value.logo, getBrandLogo(next, settings.value.logo))
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
    applyFrameSourceType(settings.value, type)
  }

  const applyWordmarkPreset = (preset: FrameWordmarkPreset) => {
    settings.value.logo.typography = getWordmarkTypography(preset)
  }

  const exportPreset = () => encodeFramePreset(settings.value)

  /** Applies a preset code as a manual choice; the caption text and tagline are kept. */
  const importPreset = (code: string) => {
    const current = settings.value
    const preset = decodeFramePreset(code, current)
    const brandChanged = preset.logo.brand !== current.logo.brand
    settings.value = { ...preset, tagline: current.tagline, outputQuality: current.outputQuality }
    brandChosen = true
    sourceChosen = true
    if (brandChanged && !taglineEdited) {
      settings.value.tagline = getCameraBrand(preset.logo.brand).tagline ?? ''
    }
  }

  return {
    settings,
    templateSpec,
    brand,
    applyTemplate,
    selectBrand,
    setTagline,
    setSourceType,
    applyWordmarkPreset,
    exportPreset,
    importPreset
  }
}

export type FrameSettingsApi = ReturnType<typeof useFrameSettings>
