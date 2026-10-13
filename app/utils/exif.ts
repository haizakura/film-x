export interface PhotoExif {
  make?: string
  model?: string
  lensMake?: string
  lensModel?: string
  software?: string
  artist?: string
  /** mm, FocalLength (0x920A) */
  focalLength?: number
  /** FocalLengthIn35mmFilm (0xA405) */
  focalLength35mm?: number
  /** FNumber (0x829D) */
  fNumber?: number
  /** seconds, ExposureTime (0x829A) */
  exposureTime?: number
  /** PhotographicSensitivity (0x8827) */
  iso?: number
  /** Raw 'YYYY:MM:DD HH:MM:SS' from DateTimeOriginal, falling back to DateTime */
  dateTimeOriginal?: string
}

type StringKey = 'make' | 'model' | 'lensMake' | 'lensModel' | 'software' | 'artist'
type NumberKey = 'focalLength' | 'focalLength35mm' | 'fNumber' | 'exposureTime' | 'iso'

interface TiffContext {
  little: boolean
  read: (offset: number, length: number) => Promise<DataView | undefined>
}

interface IfdEntry {
  type: number
  count: number
  /** Entry table the value field lives in, and its position there. */
  table: DataView
  position: number
}

const TYPE_ASCII = 2
const TYPE_SHORT = 3
const TYPE_LONG = 4
const TYPE_RATIONAL = 5
const TYPE_SRATIONAL = 10

const TYPE_SIZE: Record<number, number> = {
  [TYPE_ASCII]: 1,
  [TYPE_SHORT]: 2,
  [TYPE_LONG]: 4,
  [TYPE_RATIONAL]: 8,
  [TYPE_SRATIONAL]: 8
}

const EXIF_POINTER_TAG = 0x8769
const ENTRY_SIZE = 12
const MAX_IFD_ENTRIES = 1000
const MAX_STRING_BYTES = 1024
const MAX_JPEG_SCAN_BYTES = 1024 * 1024
const MAX_CHUNKS = 10_000

const IFD0_STRING_TAGS: Record<number, StringKey | 'dateTimeOriginal'> = {
  0x010f: 'make',
  0x0110: 'model',
  0x0131: 'software',
  0x013b: 'artist',
  0x0132: 'dateTimeOriginal'
}

const EXIF_STRING_TAGS: Record<number, StringKey | 'dateTimeOriginal'> = {
  0xa433: 'lensMake',
  0xa434: 'lensModel',
  0x9003: 'dateTimeOriginal'
}

const EXIF_NUMBER_TAGS: Record<number, NumberKey> = {
  0x920a: 'focalLength',
  0xa405: 'focalLength35mm',
  0x829d: 'fNumber',
  0x829a: 'exposureTime',
  0x8827: 'iso'
}

const fourCC = (text: string) =>
  ((text.charCodeAt(0) << 24) |
    (text.charCodeAt(1) << 16) |
    (text.charCodeAt(2) << 8) |
    text.charCodeAt(3)) >>>
  0

const PNG_EXIF = fourCC('eXIf')
const PNG_IEND = fourCC('IEND')
const WEBP_EXIF = fourCC('EXIF')
const EXIF_PREFIX = [0x45, 0x78, 0x69, 0x66, 0, 0]
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

const readBytes = async (blob: Blob, start: number, length: number) => {
  if (!Number.isInteger(start) || start < 0 || length <= 0 || start + length > blob.size) {
    return undefined
  }
  const buffer = await blob.slice(start, start + length).arrayBuffer()
  return buffer.byteLength === length ? new DataView(buffer) : undefined
}

const matchesBytes = (view: DataView, offset: number, expected: number[]) =>
  offset + expected.length <= view.byteLength &&
  expected.every((byte, index) => view.getUint8(offset + index) === byte)

const readEntries = async (context: TiffContext, offset: number) => {
  const entries = new Map<number, IfdEntry>()
  const head = await context.read(offset, 2)
  if (!head) return entries
  const count = head.getUint16(0, context.little)
  if (count === 0 || count > MAX_IFD_ENTRIES) return entries
  const table = await context.read(offset + 2, count * ENTRY_SIZE)
  if (!table) return entries
  for (let index = 0; index < count; index += 1) {
    const base = index * ENTRY_SIZE
    entries.set(table.getUint16(base, context.little), {
      type: table.getUint16(base + 2, context.little),
      count: table.getUint32(base + 4, context.little),
      table,
      position: base + 8
    })
  }
  return entries
}

/** Returns the view and offset holding the first `length` bytes of the entry's value. */
const locateValue = async (context: TiffContext, entry: IfdEntry, length: number) => {
  if (entry.count * (TYPE_SIZE[entry.type] ?? 0) <= 4) {
    return { view: entry.table, at: entry.position }
  }
  const pointer = entry.table.getUint32(entry.position, context.little)
  const view = await context.read(pointer, length)
  return view ? { view, at: 0 } : undefined
}

const readNumber = async (context: TiffContext, entry: IfdEntry) => {
  const size = TYPE_SIZE[entry.type]
  if (!size || entry.type === TYPE_ASCII || entry.count < 1) return undefined
  const located = await locateValue(context, entry, size)
  if (!located) return undefined
  const { view, at } = located
  const { little } = context
  let value: number
  switch (entry.type) {
    case TYPE_SHORT:
      value = view.getUint16(at, little)
      break
    case TYPE_LONG:
      value = view.getUint32(at, little)
      break
    case TYPE_RATIONAL:
      value = view.getUint32(at, little) / view.getUint32(at + 4, little)
      break
    default:
      value = view.getInt32(at, little) / view.getInt32(at + 4, little)
  }
  return Number.isFinite(value) ? value : undefined
}

const readString = async (context: TiffContext, entry: IfdEntry) => {
  if (entry.type !== TYPE_ASCII || entry.count < 1) return undefined
  const length = Math.min(entry.count, MAX_STRING_BYTES)
  const located = await locateValue(context, entry, length)
  if (!located) return undefined
  const bytes = new Uint8Array(located.view.buffer, located.view.byteOffset + located.at, length)
  const end = bytes.indexOf(0)
  const text = new TextDecoder('utf-8', { fatal: false })
    .decode(end < 0 ? bytes : bytes.subarray(0, end))
    .trim()
  return text || undefined
}

const collectStrings = async <Key extends string>(
  context: TiffContext,
  entries: Map<number, IfdEntry>,
  tags: Record<number, Key>
) => {
  const result: Partial<Record<Key, string>> = {}
  await Promise.all(
    Object.entries(tags).map(async ([tag, key]) => {
      const entry = entries.get(Number(tag))
      const value = entry && (await readString(context, entry))
      if (value) result[key] = value
    })
  )
  return result
}

const collectNumbers = async (context: TiffContext, entries: Map<number, IfdEntry>) => {
  const result: Partial<Record<NumberKey, number>> = {}
  await Promise.all(
    Object.entries(EXIF_NUMBER_TAGS).map(async ([tag, key]) => {
      const entry = entries.get(Number(tag))
      const value = entry && (await readNumber(context, entry))
      if (value !== undefined && value > 0) result[key] = value
    })
  )
  return result
}

const parseTiff = async (blob: Blob, base: number): Promise<PhotoExif | undefined> => {
  const header = await readBytes(blob, base, 8)
  if (!header) return undefined
  const little = header.getUint16(0) === 0x4949
  if (!little && header.getUint16(0) !== 0x4d4d) return undefined
  if (header.getUint16(2, little) !== 42) return undefined

  const context: TiffContext = {
    little,
    read: (offset, length) => readBytes(blob, base + offset, length)
  }
  const ifd0 = await readEntries(context, header.getUint32(4, little))
  const ifd0Strings = await collectStrings(context, ifd0, IFD0_STRING_TAGS)

  let exifStrings: Partial<Record<StringKey | 'dateTimeOriginal', string>> = {}
  let exifNumbers: Partial<Record<NumberKey, number>> = {}
  const pointer = ifd0.get(EXIF_POINTER_TAG)
  const exifOffset = pointer && (await readNumber(context, pointer))
  if (exifOffset) {
    const exifEntries = await readEntries(context, exifOffset)
    ;[exifStrings, exifNumbers] = await Promise.all([
      collectStrings(context, exifEntries, EXIF_STRING_TAGS),
      collectNumbers(context, exifEntries)
    ])
  }

  const result: PhotoExif = { ...ifd0Strings, ...exifStrings, ...exifNumbers }
  return Object.keys(result).length > 0 ? result : undefined
}

/** Offset of the TIFF header inside the first JPEG Exif APP1 segment. */
const findJpegTiff = async (blob: Blob) => {
  const view = await readBytes(blob, 0, Math.min(blob.size, MAX_JPEG_SCAN_BYTES))
  if (!view) return undefined
  let pos = 2
  while (pos + 4 <= view.byteLength && view.getUint8(pos) === 0xff) {
    const marker = view.getUint8(pos + 1)
    if (marker === 0xff) {
      pos += 1
      continue
    }
    if (marker === 0xda || marker === 0xd9) return undefined
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      pos += 2
      continue
    }
    const length = view.getUint16(pos + 2)
    if (length < 2) return undefined
    if (marker === 0xe1 && matchesBytes(view, pos + 4, EXIF_PREFIX)) return pos + 4 + 6
    pos += 2 + length
  }
  return undefined
}

const findPngTiff = async (blob: Blob) => {
  let pos = PNG_SIGNATURE.length
  for (let index = 0; index < MAX_CHUNKS; index += 1) {
    // oxlint-disable-next-line no-await-in-loop -- each chunk position depends on the previous length
    const head = await readBytes(blob, pos, 8)
    if (!head) return undefined
    const type = head.getUint32(4)
    if (type === PNG_EXIF) return pos + 8
    if (type === PNG_IEND) return undefined
    pos += 12 + head.getUint32(0)
  }
  return undefined
}

const findWebpTiff = async (blob: Blob) => {
  let pos = 12
  for (let index = 0; index < MAX_CHUNKS; index += 1) {
    // oxlint-disable-next-line no-await-in-loop -- each chunk position depends on the previous size
    const head = await readBytes(blob, pos, 8)
    if (!head) return undefined
    const size = head.getUint32(4, true)
    if (head.getUint32(0) === WEBP_EXIF) {
      // oxlint-disable-next-line no-await-in-loop -- runs once, right before returning
      const prefix = await readBytes(blob, pos + 8, Math.min(size, EXIF_PREFIX.length))
      return pos + 8 + (prefix && matchesBytes(prefix, 0, EXIF_PREFIX) ? EXIF_PREFIX.length : 0)
    }
    pos += 8 + size + (size % 2)
  }
  return undefined
}

const findTiffOffset = async (blob: Blob) => {
  const head = await readBytes(blob, 0, Math.min(blob.size, 12))
  if (!head) return undefined
  if (matchesBytes(head, 0, [0xff, 0xd8])) return findJpegTiff(blob)
  if (matchesBytes(head, 0, PNG_SIGNATURE)) return findPngTiff(blob)
  if (
    matchesBytes(head, 0, [0x52, 0x49, 0x46, 0x46]) &&
    matchesBytes(head, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return findWebpTiff(blob)
  }
  const classic =
    matchesBytes(head, 0, [0x49, 0x49, 0x2a, 0]) || matchesBytes(head, 0, [0x4d, 0x4d, 0, 0x2a])
  return classic ? 0 : undefined
}

/**
 * Reads camera metadata from JPEG, PNG, WebP or TIFF without loading the whole file.
 * Returns undefined when no readable EXIF exists; never throws.
 */
export const readPhotoExif = async (file: Blob): Promise<PhotoExif | undefined> => {
  try {
    const base = await findTiffOffset(file)
    return base === undefined ? undefined : await parseTiff(file, base)
  } catch {
    return undefined
  }
}
