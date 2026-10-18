import { toast } from 'vue-sonner'
import type { FrameSettingsApi } from '~/composables/useFrameSettings'
import { errorMessageKey } from '~/utils/errors'

/** Preset code field: copies the current settings out and applies pasted codes. */
export const useFramePreset = (frame: Pick<FrameSettingsApi, 'exportPreset' | 'importPreset'>) => {
  const { t } = useI18n()
  const translateError = useTranslatedError()
  const code = ref('')

  const copy = async () => {
    code.value = frame.exportPreset()
    try {
      await navigator.clipboard.writeText(code.value)
      toast.success(t('frame.preset.copied'))
    } catch {
      // The code stays in the field, so it can still be copied by hand.
      toast.warning(t('frame.preset.copyFailed'))
    }
  }

  const apply = () => {
    if (!code.value.trim()) {
      toast.warning(t('frame.preset.empty'))
      return
    }
    try {
      frame.importPreset(code.value)
      toast.success(t('frame.preset.applied'))
    } catch (error) {
      toast.error(t('frame.preset.applyFailed'), {
        description: translateError(
          errorMessageKey(error, 'errors.framePresetInvalid'),
          'errors.framePresetInvalid'
        )
      })
    }
  }

  return { code, copy, apply }
}
