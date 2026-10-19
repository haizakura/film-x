import type { FrameInfoField, FrameInfoFields } from '~/types/frame'
import type { PhotoExif } from '~/utils/exif'
import {
  createEmptyFrameFields,
  detectFrameSourceType,
  FRAME_EXIF_FIELDS,
  getFrameExifFill
} from '~/utils/frameMetadata'
import type { FrameSettingsApi } from '~/composables/useFrameSettings'

/** Caption fields auto-filled from EXIF; anything the user edits is kept across photos. */
export const useFrameMetadata = (frame: FrameSettingsApi) => {
  const fields = ref<FrameInfoFields>(createEmptyFrameFields())
  const exif = shallowRef<PhotoExif>()
  const edited = new Set<FrameInfoField>()

  const setField = (field: FrameInfoField, value: string) => {
    edited.add(field)
    fields.value[field] = value
  }

  /**
   * Applies metadata from a newly loaded photo. Film scan EXIF describes the scanner, not the
   * camera, so it fills nothing; edited fields stay for the whole roll. `force` fills everything.
   */
  const applyExif = (next: PhotoExif | undefined, force = false) => {
    exif.value = next
    if (!force) {
      const detected = detectFrameSourceType(next)
      if (detected) frame.setSourceType(detected, 'auto')
    }
    const { brandId, values } = getFrameExifFill(next, frame.settings.value.sourceType, force)
    if (brandId) frame.selectBrand(brandId, force ? 'force' : 'auto')
    for (const field of FRAME_EXIF_FIELDS) {
      if (force) edited.delete(field)
      if (!edited.has(field)) fields.value[field] = values[field] ?? ''
    }
  }

  const fillFromExif = () => applyExif(exif.value, true)

  return { fields, exif, setField, applyExif, fillFromExif }
}
