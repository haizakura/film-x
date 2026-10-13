import type { CameraBrand, CameraBrandId } from '~/types/frame'
import type { PhotoExif } from '~/utils/exif'

// Order matters for EXIF matching: sub-brands and OEM relationships come first.
export const CAMERA_BRANDS: readonly CameraBrand[] = [
  {
    id: 'hasselblad',
    name: 'Hasselblad',
    wordmarkPreset: 'classic',
    tagline: 'CREATE TO INSPIRE',
    marks: [],
    exifPattern: /hasselblad/i
  },
  {
    id: 'leica',
    name: 'Leica',
    wordmarkPreset: 'script',
    wordmark: 'Leica',
    tagline: 'DAS WESENTLICHE',
    marks: [],
    exifPattern: /leica/i
  },
  { id: 'nikon', name: 'Nikon', wordmarkPreset: 'heavy', marks: [], exifPattern: /nikon/i },
  { id: 'canon', name: 'Canon', wordmarkPreset: 'roman', marks: [], exifPattern: /canon/i },
  { id: 'sony', name: 'Sony', wordmarkPreset: 'roman', marks: [], exifPattern: /sony/i },
  {
    id: 'fujifilm',
    name: 'Fujifilm',
    wordmarkPreset: 'heavy',
    marks: [],
    exifPattern: /fujifilm|fuji photo/i
  },
  {
    id: 'om-system',
    name: 'OM System',
    wordmarkPreset: 'geometric',
    marks: [],
    exifPattern: /om digital|om system/i
  },
  { id: 'olympus', name: 'Olympus', wordmarkPreset: 'roman', marks: [], exifPattern: /olympus/i },
  {
    id: 'panasonic',
    name: 'Panasonic',
    wordmarkPreset: 'heavy',
    marks: [],
    exifPattern: /panasonic|lumix/i
  },
  {
    id: 'pentax',
    name: 'Pentax',
    wordmarkPreset: 'heavy',
    marks: [],
    exifPattern: /pentax|asahi/i
  },
  { id: 'ricoh', name: 'Ricoh', wordmarkPreset: 'heavy', marks: [], exifPattern: /ricoh/i },
  { id: 'sigma', name: 'Sigma', wordmarkPreset: 'geometric', marks: [], exifPattern: /sigma/i },
  { id: 'zeiss', name: 'Zeiss', wordmarkPreset: 'geometric', marks: [], exifPattern: /zeiss/i },
  {
    id: 'phase-one',
    name: 'Phase One',
    wordmarkPreset: 'geometric',
    marks: [],
    exifPattern: /phase one/i
  },
  { id: 'mamiya', name: 'Mamiya', wordmarkPreset: 'heavy', marks: [], exifPattern: /mamiya/i },
  {
    id: 'contax',
    name: 'Contax',
    wordmarkPreset: 'wide',
    marks: [],
    exifPattern: /contax|kyocera/i
  },
  { id: 'minolta', name: 'Minolta', wordmarkPreset: 'heavy', marks: [], exifPattern: /minolta/i },
  { id: 'konica', name: 'Konica', wordmarkPreset: 'heavy', marks: [], exifPattern: /konica/i },
  { id: 'rollei', name: 'Rollei', wordmarkPreset: 'classic', marks: [], exifPattern: /rollei/i },
  {
    id: 'voigtlander',
    name: 'Voigtländer',
    wordmarkPreset: 'classic',
    marks: [],
    exifPattern: /voigtl/i
  },
  { id: 'yashica', name: 'Yashica', wordmarkPreset: 'heavy', marks: [], exifPattern: /yashica/i },
  { id: 'bronica', name: 'Bronica', wordmarkPreset: 'wide', marks: [], exifPattern: /bronica/i },
  { id: 'linhof', name: 'Linhof', wordmarkPreset: 'roman', marks: [], exifPattern: /linhof/i },
  { id: 'kodak', name: 'Kodak', wordmarkPreset: 'heavy', marks: [], exifPattern: /kodak|eastman/i },
  {
    id: 'polaroid',
    name: 'Polaroid',
    wordmarkPreset: 'heavy',
    marks: [],
    exifPattern: /polaroid/i
  },
  {
    id: 'lomography',
    name: 'Lomography',
    wordmarkPreset: 'script',
    wordmark: 'Lomography',
    marks: [],
    exifPattern: /lomo/i
  },
  { id: 'ilford', name: 'Ilford', wordmarkPreset: 'heavy', marks: [], exifPattern: /ilford/i },
  { id: 'agfa', name: 'Agfa', wordmarkPreset: 'heavy', marks: [], exifPattern: /agfa/i },
  { id: 'apple', name: 'Apple', wordmarkPreset: 'geometric', marks: [], exifPattern: /apple/i },
  { id: 'samsung', name: 'Samsung', wordmarkPreset: 'wide', marks: [], exifPattern: /samsung/i },
  { id: 'google', name: 'Google', wordmarkPreset: 'geometric', marks: [], exifPattern: /google/i },
  {
    id: 'xiaomi',
    name: 'Xiaomi',
    wordmarkPreset: 'geometric',
    marks: [],
    exifPattern: /xiaomi|redmi/i
  },
  { id: 'huawei', name: 'Huawei', wordmarkPreset: 'wide', marks: [], exifPattern: /huawei/i },
  { id: 'honor', name: 'Honor', wordmarkPreset: 'wide', marks: [], exifPattern: /honor/i },
  { id: 'oppo', name: 'OPPO', wordmarkPreset: 'geometric', marks: [], exifPattern: /oppo/i },
  { id: 'vivo', name: 'vivo', wordmarkPreset: 'geometric', marks: [], exifPattern: /vivo/i },
  {
    id: 'oneplus',
    name: 'OnePlus',
    wordmarkPreset: 'geometric',
    marks: [],
    exifPattern: /oneplus/i
  },
  { id: 'dji', name: 'DJI', wordmarkPreset: 'wide', marks: [], exifPattern: /\bdji\b/i },
  { id: 'gopro', name: 'GoPro', wordmarkPreset: 'heavy', marks: [], exifPattern: /gopro/i },
  {
    id: 'insta360',
    name: 'Insta360',
    wordmarkPreset: 'geometric',
    marks: [],
    exifPattern: /insta360|arashi/i
  },
  { id: 'custom', name: '', wordmarkPreset: 'classic', wordmark: '', marks: [] }
]

const BRANDS_BY_ID = new Map(CAMERA_BRANDS.map((brand) => [brand.id, brand]))

export const getCameraBrand = (id: CameraBrandId): CameraBrand =>
  BRANDS_BY_ID.get(id) ?? (CAMERA_BRANDS.at(-1) as CameraBrand)

const MARKS_BY_ID = new Map(
  CAMERA_BRANDS.flatMap((brand) => brand.marks.map((mark) => [mark.id, mark] as const))
)

export const getLogoMark = (id: string) => MARKS_BY_ID.get(id)

/** Brand implied by the EXIF Make and Model, or undefined for unknown manufacturers. */
export const matchCameraBrand = (exif: PhotoExif): CameraBrandId | undefined => {
  const source = [exif.make, exif.model].filter(Boolean).join(' ')
  if (!source) return undefined
  return CAMERA_BRANDS.find((brand) => brand.exifPattern?.test(source))?.id
}
