import assert from 'node:assert/strict'
import test from 'node:test'
import { deflateSync, strToU8 } from 'fflate'
import { MAX_FRAME_BORDER, MAX_FRAME_PRESET_LENGTH } from '~/types/frame'
import { decodeFramePreset, encodeFramePreset } from '~/utils/framePreset'
import { createDefaultFrameSettings } from '~/utils/frameSettings'

// Same wire format as encodeFramePreset, but from hand-written JSON text.
const code = (json) => `FXF1.${Buffer.from(deflateSync(strToU8(json))).toString('base64url')}`

const base = () => createDefaultFrameSettings()
// A preset omits the caption text and export quality.
const carried = (settings) => {
  const { tagline: _t, outputQuality: _q, ...rest } = settings
  return rest
}

const assertAppError = (fn, expected) =>
  assert.throws(fn, (error) => error.name === 'AppError' && error.code === expected)

test('defaults and modified settings round-trip', () => {
  const defaults = base()
  assert.deepEqual(decodeFramePreset(encodeFramePreset(defaults), base()), carried(defaults))

  const changed = {
    ...base(),
    template: 'polaroid',
    frameColor: '#112233',
    textScale: 1.5,
    showTagline: !defaults.showTagline
  }
  const decoded = decodeFramePreset(encodeFramePreset(changed), base())
  assert.deepEqual(decoded, carried(changed))
})

test('wrong types, unknown enums and Infinity fall back or clamp', () => {
  const defaults = base()
  const decoded = decodeFramePreset(
    code(
      '{"template":"nope","textScale":"big","ratio":1e400,"border":[1],"frameColor":7,' +
        '"logo":"x","lines":[],"outputFormat":"gif","outputLongSide":1e400,"textColor":null}'
    ),
    defaults
  )
  assert.deepEqual(decoded, carried(defaults))

  const clamped = decodeFramePreset(
    code('{"textScale":1e300,"border":{"top":-5,"left":99}}'),
    base()
  )
  assert.ok(Number.isFinite(clamped.textScale) && clamped.textScale < 1e300)
  assert.equal(clamped.border.top, 0)
  assert.ok(clamped.border.left <= MAX_FRAME_BORDER)
})

test('a __proto__ key does not pollute prototypes', () => {
  const decoded = decodeFramePreset(
    code('{"__proto__":{"polluted":true},"border":{"__proto__":{"polluted":true}}}'),
    base()
  )
  assert.equal({}.polluted, undefined)
  assert.equal(Object.prototype.polluted, undefined)
  assert.equal(decoded.polluted, undefined)
})

test('invalid codes throw AppError', () => {
  assertAppError(() => decodeFramePreset('hello', base()), 'framePresetInvalid')
  assertAppError(
    () => decodeFramePreset(`FXF1.${'A'.repeat(MAX_FRAME_PRESET_LENGTH)}`, base()),
    'framePresetInvalid'
  )
  assertAppError(() => decodeFramePreset('FXF1.AAAA', base()), 'framePresetInvalid')
  assertAppError(() => decodeFramePreset(code('[1]'), base()), 'framePresetInvalid')
  assertAppError(
    () => decodeFramePreset(code('{').replace('FXF1', 'FXF2'), base()),
    'framePresetUnsupported'
  )
})

test('a bottom caption template caps border.bottom at MAX_FRAME_BORDER', () => {
  const decoded = decodeFramePreset(code('{"template":"gallery","border":{"bottom":1}}'), base())
  assert.equal(decoded.template, 'gallery')
  assert.equal(decoded.border.bottom, MAX_FRAME_BORDER)
})
