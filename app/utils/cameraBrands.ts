import type { CameraBrand, CameraBrandId, FrameLogoMark } from '~/types/frame'
import type { PhotoExif } from '~/utils/exif'

const mono = (id: string): FrameLogoMark => ({ id, tintable: true })
// Boxed or knocked-out artwork would lose its detail if flattened to one colour.
const color = (id: string): FrameLogoMark => ({ id, tintable: false })

// Order matters for EXIF matching: sub-brands and OEM relationships come first.
export const CAMERA_BRANDS: readonly CameraBrand[] = [
  {
    id: 'hasselblad',
    name: 'Hasselblad',
    wordmarkPreset: 'classic',
    tagline: 'CREATE TO INSPIRE',
    marks: [mono('hasselblad-wordmark'), mono('hasselblad-wordmark-blue')],
    exifPattern: /hasselblad/i
  },
  {
    id: 'leica',
    name: 'Leica',
    wordmarkPreset: 'script',
    wordmark: 'Leica',
    tagline: 'DAS WESENTLICHE',
    marks: [color('leica-dot'), mono('leica-dot-mono'), color('leitz-dot')],
    exifPattern: /leica/i
  },
  {
    id: 'nikon',
    name: 'Nikon',
    wordmarkPreset: 'heavy',
    marks: [color('nikon-box'), mono('nikon-mono'), mono('nikon-nikkor'), mono('nikon-z-series')],
    exifPattern: /nikon/i
  },
  {
    id: 'canon',
    name: 'Canon',
    wordmarkPreset: 'roman',
    marks: [mono('canon-wordmark'), mono('canon-eos')],
    exifPattern: /canon/i
  },
  {
    id: 'sony',
    name: 'Sony',
    wordmarkPreset: 'roman',
    marks: [mono('sony-wordmark'), color('sony-alpha')],
    exifPattern: /sony/i
  },
  {
    id: 'fujifilm',
    name: 'Fujifilm',
    wordmarkPreset: 'heavy',
    marks: [mono('fujifilm-wordmark'), mono('fujifilm-vintage'), mono('fujifilm-instax')],
    exifPattern: /fujifilm|fuji photo/i
  },
  {
    id: 'om-system',
    name: 'OM System',
    wordmarkPreset: 'geometric',
    marks: [],
    exifPattern: /om digital|om system/i
  },
  {
    id: 'olympus',
    name: 'Olympus',
    wordmarkPreset: 'roman',
    marks: [color('olympus-wordmark')],
    exifPattern: /olympus/i
  },
  {
    id: 'panasonic',
    name: 'Panasonic',
    wordmarkPreset: 'heavy',
    marks: [mono('panasonic-wordmark'), mono('lumix-wordmark')],
    exifPattern: /panasonic|lumix/i
  },
  {
    id: 'pentax',
    name: 'Pentax',
    wordmarkPreset: 'heavy',
    marks: [mono('pentax-wordmark'), mono('pentax-p')],
    exifPattern: /pentax|asahi/i
  },
  {
    id: 'ricoh',
    name: 'Ricoh',
    wordmarkPreset: 'heavy',
    marks: [mono('ricoh-wordmark'), mono('ricoh-vintage'), mono('ricoh-tagline')],
    exifPattern: /ricoh/i
  },
  {
    id: 'sigma',
    name: 'Sigma',
    wordmarkPreset: 'geometric',
    marks: [mono('sigma-wordmark'), mono('sigma-wordmark-2025')],
    exifPattern: /sigma/i
  },
  {
    id: 'zeiss',
    name: 'Zeiss',
    wordmarkPreset: 'geometric',
    marks: [color('zeiss-wordmark'), mono('zeiss-ikon')],
    exifPattern: /zeiss/i
  },
  {
    id: 'phase-one',
    name: 'Phase One',
    wordmarkPreset: 'geometric',
    marks: [mono('phase-one-wordmark')],
    exifPattern: /phase one/i
  },
  {
    id: 'mamiya',
    name: 'Mamiya',
    wordmarkPreset: 'heavy',
    marks: [mono('mamiya-wordmark')],
    exifPattern: /mamiya/i
  },
  {
    id: 'contax',
    name: 'Contax',
    wordmarkPreset: 'wide',
    marks: [mono('contax-wordmark')],
    exifPattern: /contax|kyocera/i
  },
  {
    id: 'minolta',
    name: 'Minolta',
    wordmarkPreset: 'heavy',
    marks: [mono('minolta-wordmark'), mono('konica-minolta')],
    exifPattern: /minolta/i
  },
  {
    id: 'konica',
    name: 'Konica',
    wordmarkPreset: 'heavy',
    marks: [mono('konica-wordmark'), mono('konica-minolta')],
    exifPattern: /konica/i
  },
  {
    id: 'rollei',
    name: 'Rollei',
    wordmarkPreset: 'classic',
    marks: [mono('rollei-wordmark')],
    exifPattern: /rollei/i
  },
  {
    id: 'voigtlander',
    name: 'Voigtländer',
    wordmarkPreset: 'classic',
    marks: [],
    exifPattern: /voigtl/i
  },
  {
    id: 'yashica',
    name: 'Yashica',
    wordmarkPreset: 'heavy',
    marks: [mono('yashica-wordmark')],
    exifPattern: /yashica/i
  },
  { id: 'bronica', name: 'Bronica', wordmarkPreset: 'wide', marks: [], exifPattern: /bronica/i },
  {
    id: 'linhof',
    name: 'Linhof',
    wordmarkPreset: 'roman',
    marks: [mono('linhof-script')],
    exifPattern: /linhof/i
  },
  {
    id: 'kodak',
    name: 'Kodak',
    wordmarkPreset: 'heavy',
    marks: [
      mono('kodak-wordmark'),
      color('kodak-box'),
      color('kodak-vintage'),
      mono('kodak-k-mono')
    ],
    exifPattern: /kodak|eastman/i
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    wordmarkPreset: 'heavy',
    marks: [
      mono('polaroid-wordmark'),
      mono('polaroid-wordmark-color-bar'),
      mono('polaroid-wordmark-diamond')
    ],
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
  {
    id: 'apple',
    name: 'Apple',
    wordmarkPreset: 'geometric',
    marks: [mono('apple-logo')],
    exifPattern: /apple/i
  },
  {
    id: 'samsung',
    name: 'Samsung',
    wordmarkPreset: 'wide',
    marks: [mono('samsung-wordmark')],
    exifPattern: /samsung/i
  },
  {
    id: 'google',
    name: 'Google',
    wordmarkPreset: 'geometric',
    marks: [mono('google-g')],
    exifPattern: /google/i
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi',
    wordmarkPreset: 'geometric',
    marks: [mono('xiaomi-mono')],
    exifPattern: /xiaomi|redmi/i
  },
  {
    id: 'huawei',
    name: 'Huawei',
    wordmarkPreset: 'wide',
    marks: [mono('huawei-mono')],
    exifPattern: /huawei/i
  },
  {
    id: 'honor',
    name: 'Honor',
    wordmarkPreset: 'wide',
    marks: [mono('honor-wordmark')],
    exifPattern: /honor/i
  },
  {
    id: 'oppo',
    name: 'OPPO',
    wordmarkPreset: 'geometric',
    marks: [mono('oppo-wordmark')],
    exifPattern: /oppo/i
  },
  {
    id: 'vivo',
    name: 'vivo',
    wordmarkPreset: 'geometric',
    marks: [mono('vivo-wordmark')],
    exifPattern: /vivo/i
  },
  {
    id: 'oneplus',
    name: 'OnePlus',
    wordmarkPreset: 'geometric',
    marks: [mono('oneplus-mono')],
    exifPattern: /oneplus/i
  },
  {
    id: 'dji',
    name: 'DJI',
    wordmarkPreset: 'wide',
    marks: [mono('dji-wordmark')],
    exifPattern: /\bdji\b/i
  },
  { id: 'gopro', name: 'GoPro', wordmarkPreset: 'heavy', marks: [], exifPattern: /gopro/i },
  {
    id: 'insta360',
    name: 'Insta360',
    wordmarkPreset: 'geometric',
    marks: [mono('insta360-mono')],
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
