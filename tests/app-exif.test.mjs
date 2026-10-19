import assert from 'node:assert/strict'
import test from 'node:test'
import { readPhotoExif } from '~/utils/exif'

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000).unref())
  ])

// Little-endian TIFF: header, then one IFD at `offset` holding the given [tag, type, count, value].
const tiff = (offset, entries) => {
  const bytes = new Uint8Array(offset + 2 + entries.length * 12 + 4 + 16)
  const view = new DataView(bytes.buffer)
  bytes.set([0x49, 0x49], 0)
  view.setUint16(2, 42, true)
  view.setUint32(4, offset, true)
  view.setUint16(offset, entries.length, true)
  entries.forEach(([tag, type, count, value], index) => {
    const at = offset + 2 + index * 12
    view.setUint16(at, tag, true)
    view.setUint16(at + 2, type, true)
    view.setUint32(at + 4, count, true)
    view.setUint32(at + 8, value, true)
  })
  return { bytes, view }
}

test('tiny blobs have no EXIF', async () => {
  assert.equal(
    await withTimeout(readPhotoExif(new Blob([new Uint8Array([0xff, 0xd8])]))),
    undefined
  )
  assert.equal(await withTimeout(readPhotoExif(new Blob([]))), undefined)
})

test('a self-referencing EXIF pointer terminates', async () => {
  const offset = 8
  // 0x8769 (Exif pointer) LONG pointing back at the same IFD.
  const { bytes } = tiff(offset, [[0x8769, 4, 1, offset]])
  assert.equal(await withTimeout(readPhotoExif(new Blob([bytes]))), undefined)

  const jpeg = new Uint8Array(12 + bytes.length)
  const length = 2 + 6 + bytes.length
  jpeg.set([0xff, 0xd8, 0xff, 0xe1, length >> 8, length & 0xff, 0x45, 0x78, 0x69, 0x66, 0, 0], 0)
  jpeg.set(bytes, 12)
  assert.equal(await withTimeout(readPhotoExif(new Blob([jpeg]))), undefined)
})

test('reads Make from a minimal TIFF', async () => {
  // ASCII "Leica\0" (6 bytes) stored out of line at the end of the buffer.
  const offset = 8
  const { bytes, view } = tiff(offset, [[0x010f, 2, 6, 0]])
  const valueAt = bytes.length - 8
  bytes.set([0x4c, 0x65, 0x69, 0x63, 0x61, 0], valueAt)
  view.setUint32(offset + 2 + 8, valueAt, true)
  assert.deepEqual(await withTimeout(readPhotoExif(new Blob([bytes]))), { make: 'Leica' })
})
