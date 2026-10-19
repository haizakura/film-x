import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getCompositionOutputGeometry,
  MAX_COMPOSITION_CANVAS_SIDE,
  MAX_COMPOSITION_GAP,
  MAX_COMPOSITION_PADDING,
  MAX_COMPOSITION_SPROCKET_WIDTH
} from '~/types/composition'
import { getCompositionGeometry } from '~/utils/compositionGeometry'
import { createDefaultCompositionSettings } from '~/utils/compositionSettings'

const sizes = [
  [1, 1],
  [3, 5000],
  [4000, 2667],
  [30000, 20000],
  [100000, 100000]
]
const pad = (value) => ({ top: value, right: value, bottom: value, left: value })

const assertSafe = (geometry, label) => {
  for (const side of [geometry.width, geometry.height]) {
    assert.ok(Number.isInteger(side) && side >= 1 && side <= MAX_COMPOSITION_CANVAS_SIDE, label)
  }
}

test('automatic geometry stays integer and within the canvas limit', () => {
  for (const [width, height] of sizes) {
    for (const frameCount of [1, 2]) {
      for (const amount of [0, MAX_COMPOSITION_PADDING]) {
        for (const ratioMode of ['auto', 'preset']) {
          for (const layoutDirection of ['horizontal', 'vertical']) {
            const settings = {
              ...createDefaultCompositionSettings(),
              frameCount,
              ratioMode,
              layoutDirection,
              canvasSizeMode: 'auto',
              padding: pad(amount),
              gap: amount ? MAX_COMPOSITION_GAP : 0
            }
            const images = [
              { width, height },
              { width: height, height: width }
            ]
            assertSafe(
              getCompositionGeometry(settings, images),
              `${width}x${height} n${frameCount} pad${amount} ${ratioMode} ${layoutDirection}`
            )
          }
        }
      }
    }
  }
})

test('manual geometry with huge requested sizes is capped', () => {
  for (const anchor of ['width', 'height']) {
    for (const ratioMode of ['auto', 'preset']) {
      const settings = {
        ...createDefaultCompositionSettings(),
        frameCount: 2,
        ratioMode,
        canvasSizeMode: 'manual',
        canvasSizeAnchor: anchor,
        canvasWidth: 1e6,
        canvasHeight: 1e6,
        padding: pad(MAX_COMPOSITION_PADDING),
        gap: MAX_COMPOSITION_GAP
      }
      assertSafe(
        getCompositionGeometry(settings, [{ width: 6000, height: 4000 }]),
        anchor + ratioMode
      )
    }
  }
})

test('sprocket band adds an integer width on each side of one axis', () => {
  const geometry = { width: MAX_COMPOSITION_CANVAS_SIDE, height: 5000, frames: [] }
  for (const placement of ['top-bottom', 'left-right']) {
    const out = getCompositionOutputGeometry(geometry, {
      enabled: true,
      placement,
      width: MAX_COMPOSITION_SPROCKET_WIDTH * 10
    })
    const band = MAX_COMPOSITION_SPROCKET_WIDTH * 2
    assert.ok(Number.isInteger(out.width) && Number.isInteger(out.height))
    assert.equal(
      placement === 'top-bottom' ? out.height - geometry.height : out.width - geometry.width,
      band
    )
  }
  const off = getCompositionOutputGeometry(geometry, {
    enabled: false,
    placement: 'top-bottom',
    width: 99
  })
  assert.deepEqual([off.width, off.height], [geometry.width, geometry.height])
})
