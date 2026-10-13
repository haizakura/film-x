import type { FrameInfoFields, FrameSourceType } from '~/types/frame'
import type { PhotoExif } from '~/utils/exif'

// Film scanners and scanning software write their own Make/Model into the EXIF block.
const SCANNER_PATTERN =
  /scan|coolscan|frontier|noritsu|flextight|imacon|pakon|plustek|perfection|expression|silverfast|reflecta|primefilm|pacific image|\bls-\d{2,4}\b|\bsp-\d{3,4}\b|\bhs-1800\b/i

// Phones and compacts report tiny real focal lengths; past this crop factor the 35 mm
// equivalent is what photographers recognise.
const SMALL_SENSOR_CROP_FACTOR = 2.5
// Above 1/10 s the reciprocal is always shown; slower speeds use decimals unless exact.
const RECIPROCAL_SHUTTER_LIMIT = 10

const trimNumber = (value: number, digits = 1) => String(Number(value.toFixed(digits)))

export const formatExposureTime = (seconds: number) => {
  const reciprocal = 1 / seconds
  const rounded = Math.round(reciprocal)
  if (
    seconds < 1 &&
    (reciprocal >= RECIPROCAL_SHUTTER_LIMIT || Math.abs(reciprocal - rounded) < 0.05)
  ) {
    return `1/${Math.max(1, rounded)}s`
  }
  return `${trimNumber(seconds)}s`
}

export const formatFNumber = (fNumber: number) => `f/${trimNumber(fNumber)}`

export const formatFocalLength = (exif: Pick<PhotoExif, 'focalLength' | 'focalLength35mm'>) => {
  const { focalLength, focalLength35mm } = exif
  if (
    focalLength35mm &&
    (!focalLength || focalLength35mm / focalLength >= SMALL_SENSOR_CROP_FACTOR)
  ) {
    return `${Math.round(focalLength35mm)}mm`
  }
  return focalLength ? `${trimNumber(focalLength)}mm` : ''
}

export const formatIso = (iso: number) => `ISO ${Math.round(iso)}`

export const formatExifDate = (value: string) => {
  const match = /^(\d{4})[:\-/](\d{2})[:\-/](\d{2})/.exec(value)
  return match ? `${match[1]}.${match[2]}.${match[3]}` : ''
}

export const isScannerExif = (exif: PhotoExif) =>
  SCANNER_PATTERN.test([exif.make, exif.model, exif.software].filter(Boolean).join(' '))

/** Returns undefined when the metadata gives no reliable hint about the source. */
export const detectFrameSourceType = (exif: PhotoExif | undefined): FrameSourceType | undefined => {
  if (!exif) return undefined
  if (isScannerExif(exif)) return 'film'
  if (exif.make || exif.model || exif.fNumber || exif.exposureTime) return 'digital'
  return undefined
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Short makers such as OM or DJI are acronyms and stay upper case.
const titleCase = (value: string) =>
  value.length <= 3 ? value : value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()

/** Combines the brand name with the model without repeating the manufacturer. */
export const formatCameraName = (exif: PhotoExif, brandName?: string) => {
  const model = exif.model?.trim() ?? ''
  const makeWord = exif.make?.trim().split(/[\s,]+/)[0] ?? ''
  const name = brandName || (makeWord ? titleCase(makeWord) : '')
  if (!model) return name
  const prefixes = [name, makeWord].filter(Boolean).map(escapeRegExp)
  const stripped = prefixes.length
    ? model.replace(new RegExp(`^(?:${prefixes.join('|')})(?:[\\s_]+|$)`, 'i'), '')
    : model
  if (!stripped) return name || model
  return name ? `${name} ${stripped}` : stripped
}

export const formatLensName = (exif: PhotoExif) => exif.lensModel?.trim() ?? ''

export const getExifInfoFields = (
  exif: PhotoExif,
  brandName?: string
): Partial<FrameInfoFields> => ({
  camera: exif.make || exif.model ? formatCameraName(exif, brandName) : '',
  lens: formatLensName(exif),
  focalLength: formatFocalLength(exif),
  aperture: exif.fNumber ? formatFNumber(exif.fNumber) : '',
  shutter: exif.exposureTime ? formatExposureTime(exif.exposureTime) : '',
  iso: exif.iso ? formatIso(exif.iso) : '',
  date: exif.dateTimeOriginal ? formatExifDate(exif.dateTimeOriginal) : ''
})
