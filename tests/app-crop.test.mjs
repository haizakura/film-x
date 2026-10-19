import assert from 'node:assert/strict'
import test from 'node:test'
import { MAX_SPLIT_CENTER, MIN_SPLIT_CENTER } from '~/types/image'
import { calculateCropRects } from '~/utils/image'

const centers = [MIN_SPLIT_CENTER, 0.5, MAX_SPLIT_CENTER]

test('gap 0 split covers every pixel without overlap', () => {
  for (let width = 2; width <= 50; width += 1) {
    for (const center of centers) {
      const [left, right] = calculateCropRects(width, 10, { center, gap: 0 })
      const label = `width ${width} center ${center}`
      assert.equal(left.x, 0, label)
      assert.equal(left.width, right.x, label)
      assert.equal(right.x + right.width, width, label)
      for (const rect of [left, right]) {
        assert.ok(Number.isInteger(rect.width) && rect.width >= 1, label)
        assert.equal(rect.height, 10, label)
      }
    }
  }
})

test('a one pixel image keeps both crops at least one pixel wide', () => {
  for (const center of centers) {
    const [left, right] = calculateCropRects(1, 4, { center, gap: 0 })
    assert.ok(left.x >= 0 && left.x + left.width <= 1)
    assert.ok(right.width >= 1)
  }
})

test('a gap only removes pixels between the crops', () => {
  const [left, right] = calculateCropRects(100, 10, { center: 0.5, gap: 0.08 })
  assert.ok(left.width + 1 <= right.x)
  assert.ok(right.x + right.width === 100)
})
