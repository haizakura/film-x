export interface FilmGrainTiles {
  fine: HTMLCanvasElement
  coarse: HTMLCanvasElement
}

// Two layers with different prime tile sizes and scales keep the repeat from lining up.
const FINE_GRAIN_TILE_SIZE = 383
const COARSE_GRAIN_TILE_SIZE = 257
const FINE_GRAIN_SEED = 0x2f6b_1d3a
const COARSE_GRAIN_SEED = 0x7c15_e9b4
const GRAIN_ALPHA_PER_SIGMA = 0.05
const COARSE_GRAIN_SCALE = 2.4
const COARSE_GRAIN_ALPHA = 0.6
const GRAIN_REFERENCE_SIDE = 2400
const MAX_GRAIN_UNIT = 4

/** Deterministic mulberry32 generator so textures stay stable across redraws. */
export const createSeededRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

/** Approximately standard-normal value from the sum of four uniform samples. */
const gaussian = (random: () => number) =>
  (random() + random() + random() + random() - 2) * Math.sqrt(3)

const createGrainTile = (size: number, seed: number) => {
  const tile = document.createElement('canvas')
  tile.width = size
  tile.height = size
  const context = tile.getContext('2d')
  if (!context) {
    tile.width = 0
    tile.height = 0
    return
  }

  // Light and dark specks with per-pixel alpha read on both black and light bases.
  const image = context.createImageData(size, size)
  const random = createSeededRandom(seed)
  for (let index = 0; index < image.data.length; index += 4) {
    const value = gaussian(random)
    const tone = value > 0 ? 255 : 0
    image.data[index] = tone
    image.data[index + 1] = tone
    image.data[index + 2] = tone
    image.data[index + 3] = Math.abs(value) * GRAIN_ALPHA_PER_SIGMA * 255
  }
  context.putImageData(image, 0, 0)
  return tile
}

export const releaseFilmGrainTiles = (tiles: FilmGrainTiles) => {
  for (const tile of [tiles.fine, tiles.coarse]) {
    tile.width = 0
    tile.height = 0
  }
}

export const createFilmGrainTiles = (): FilmGrainTiles | undefined => {
  const fine = createGrainTile(FINE_GRAIN_TILE_SIZE, FINE_GRAIN_SEED)
  const coarse = createGrainTile(COARSE_GRAIN_TILE_SIZE, COARSE_GRAIN_SEED)
  if (fine && coarse) return { fine, coarse }
  if (fine) releaseFilmGrainTiles({ fine, coarse: fine })
  if (coarse) releaseFilmGrainTiles({ fine: coarse, coarse })
}

/** Tiles grain over the given area; grain size follows the output resolution. */
export const drawFilmGrain = (
  context: CanvasRenderingContext2D,
  tiles: FilmGrainTiles,
  width: number,
  height: number
) => {
  const unit = Math.min(MAX_GRAIN_UNIT, Math.max(1, Math.max(width, height) / GRAIN_REFERENCE_SIDE))
  const layers = [
    { tile: tiles.fine, scale: unit, alpha: 1 },
    { tile: tiles.coarse, scale: unit * COARSE_GRAIN_SCALE, alpha: COARSE_GRAIN_ALPHA }
  ]

  context.save()
  context.imageSmoothingEnabled = true
  for (const layer of layers) {
    const pattern = context.createPattern(layer.tile, 'repeat')
    if (!pattern) continue
    pattern.setTransform(new DOMMatrix().scaleSelf(layer.scale))
    context.globalAlpha = layer.alpha
    context.fillStyle = pattern
    context.fillRect(0, 0, width, height)
  }
  context.restore()
}
