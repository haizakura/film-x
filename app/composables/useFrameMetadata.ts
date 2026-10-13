import type { FrameInfoField, FrameInfoFields } from '~/types/frame'
import { getCameraBrand, matchCameraBrand } from '~/utils/cameraBrands'
import type { PhotoExif } from '~/utils/exif'
import { detectFrameSourceType, getExifInfoFields } from '~/utils/frameMetadata'
import type { FrameSettingsApi } from '~/composables/useFrameSettings'

const EXIF_FIELDS: readonly FrameInfoField[] = [
  'camera',
  'lens',
  'focalLength',
  'aperture',
  'shutter',
  'iso',
  'date'
]

const emptyFields = (): FrameInfoFields => ({
  camera: '',
  lens: '',
  film: '',
  focalLength: '',
  aperture: '',
  shutter: '',
  iso: '',
  date: '',
  custom: ''
})

/** Caption fields auto-filled from EXIF; anything the user edits is kept across photos. */
export const useFrameMetadata = (frame: FrameSettingsApi) => {
  const fields = ref<FrameInfoFields>(emptyFields())
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
    const usable = next && (force || frame.settings.value.sourceType === 'digital')
    const brandId = usable ? matchCameraBrand(next) : undefined
    if (brandId) frame.selectBrand(brandId, force ? 'force' : 'auto')
    const values = usable ? getExifInfoFields(next, brandId && getCameraBrand(brandId).name) : {}
    for (const field of EXIF_FIELDS) {
      if (force) edited.delete(field)
      if (!edited.has(field)) fields.value[field] = values[field] ?? ''
    }
  }

  const fillFromExif = () => applyExif(exif.value, true)

  return { fields, exif, setField, applyExif, fillFromExif }
}
