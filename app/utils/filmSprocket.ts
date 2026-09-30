import { clampCompositionSprocketWidth } from '~/types/composition'
import type {
  CompositionOutputGeometry,
  CompositionSprocket,
  CompositionSprocketPlacement
} from '~/types/composition'
import { isLightColor, parseHexColor } from '~/utils/color'
import type { RgbColor } from '~/utils/color'
import { createSeededRandom } from '~/utils/filmTexture'

// 135 film with KS perforations: holes are 1.98 mm along the film, 2.79 mm across it,
// repeat every 4.75 mm and sit closer to the image than to the film edge.
const HOLE_ACROSS_RATIO = 0.5
const HOLE_OUTER_MARGIN_RATIO = 0.34
const HOLE_ALONG_TO_ACROSS = 1.98 / 2.79
const HOLE_PITCH_TO_ALONG = 4.75 / 1.98
const HOLE_CORNER_TO_SHORT_SIDE = 0.3
const TEXT_SIZE_RATIO = 0.24
const MIN_TEXT_SIZE = 6
const TEXT_LETTER_SPACING = 0.06
const TEXT_FONT_FAMILY =
  '"Helvetica Neue", Helvetica, Arial, "PingFang SC", "Hiragino Sans", "Noto Sans CJK SC", sans-serif'
const HOLE_TEXTURE_SEED = 0x5f37_59df
const HOLE_VARIANT_COUNT = 12

export interface SprocketLayout {
  placement: CompositionSprocketPlacement
  bandWidth: number
  longSide: number
  outerMargin: number
  holeAlong: number
  holeAcross: number
  holeRadius: number
  pitch: number
  holeCount: number
  firstHoleOffset: number
}

interface SprocketHole {
  x: number
  y: number
  width: number
  height: number
}

export const getSprocketLayout = (
  output: Pick<CompositionOutputGeometry, 'width' | 'height'>,
  sprocket: Pick<CompositionSprocket, 'placement' | 'width'>
): SprocketLayout => {
  const bandWidth = clampCompositionSprocketWidth(sprocket.width)
  const longSide = sprocket.placement === 'top-bottom' ? output.width : output.height
  const holeAcross = bandWidth * HOLE_ACROSS_RATIO
  const holeAlong = holeAcross * HOLE_ALONG_TO_ACROSS
  const pitch = holeAlong * HOLE_PITCH_TO_ALONG
  const holeCount = Math.max(0, Math.floor((longSide - holeAlong) / pitch) + 1)
  const span = holeCount > 0 ? (holeCount - 1) * pitch + holeAlong : 0

  return {
    placement: sprocket.placement,
    bandWidth,
    longSide,
    outerMargin: bandWidth * HOLE_OUTER_MARGIN_RATIO,
    holeAlong,
    holeAcross,
    holeRadius: Math.min(holeAlong, holeAcross) * HOLE_CORNER_TO_SHORT_SIDE,
    pitch,
    holeCount,
    firstHoleOffset: (longSide - span) / 2
  }
}

const getSprocketHoles = (
  layout: SprocketLayout,
  output: Pick<CompositionOutputGeometry, 'width' | 'height'>
) => {
  const holes: SprocketHole[] = []
  const farBandOffset = layout.bandWidth - layout.outerMargin - layout.holeAcross
  for (let index = 0; index < layout.holeCount; index++) {
    const alongOffset = layout.firstHoleOffset + index * layout.pitch
    if (layout.placement === 'top-bottom') {
      const size = { width: layout.holeAlong, height: layout.holeAcross }
      holes.push({ x: alongOffset, y: layout.outerMargin, ...size })
      holes.push({
        x: alongOffset,
        y: output.height - layout.bandWidth + farBandOffset,
        ...size
      })
    } else {
      const size = { width: layout.holeAcross, height: layout.holeAlong }
      holes.push({ x: layout.outerMargin, y: alongOffset, ...size })
      holes.push({
        x: output.width - layout.bandWidth + farBandOffset,
        y: alongOffset,
        ...size
      })
    }
  }
  return holes
}

/**
 * Prints the edge text in the strip between the film edge and the perforations of both bands,
 * with the two rows staggered by half a repeat. Left-and-right bands read bottom to top.
 */
export const drawSprocketText = (
  context: CanvasRenderingContext2D,
  output: Pick<CompositionOutputGeometry, 'width' | 'height'>,
  sprocket: Pick<CompositionSprocket, 'placement' | 'width' | 'text' | 'textColor'>
) => {
  const text = sprocket.text.trim()
  if (!text) return

  const layout = getSprocketLayout(output, sprocket)
  const fontSize = Math.max(MIN_TEXT_SIZE, layout.bandWidth * TEXT_SIZE_RATIO)
  const crossSide = layout.placement === 'top-bottom' ? output.height : output.width

  context.save()
  if (layout.placement === 'left-right') {
    context.translate(0, output.height)
    context.rotate(-Math.PI / 2)
  }
  // Local space: x runs along the bands, y runs across from the first band's film edge.
  context.font = `700 ${fontSize}px ${TEXT_FONT_FAMILY}`
  context.letterSpacing = `${fontSize * TEXT_LETTER_SPACING}px`
  context.fillStyle = sprocket.textColor
  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'

  const metrics = context.measureText(text)
  const gap = Math.max(fontSize * 8, layout.pitch * 4)
  const count = Math.max(1, Math.floor(layout.longSide / (metrics.width + gap)))
  const segment = layout.longSide / count
  const maxWidth = Math.max(1, Math.min(segment, layout.longSide) - fontSize)
  // Keep the outermost repeats whole instead of letting the film edge cut them off.
  const minCenter = fontSize / 2 + Math.min(metrics.width, maxWidth) / 2
  const maxCenter = Math.max(minCenter, layout.longSide - minCenter)
  const baseline =
    layout.outerMargin / 2 +
    (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2
  const rows = [
    { top: 0, phase: 0.25 },
    { top: crossSide - layout.outerMargin, phase: 0.75 }
  ]

  for (const row of rows) {
    context.save()
    context.beginPath()
    context.rect(0, row.top, layout.longSide, layout.outerMargin)
    context.clip()
    for (let index = 0; index < count; index++) {
      const center = Math.min(maxCenter, Math.max(minCenter, segment * (index + row.phase)))
      context.fillText(text, center, row.top + baseline, maxWidth)
    }
    context.restore()
  }
  context.restore()
}

const smoothstep = (value: number) => {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped * clamped * (3 - 2 * clamped)
}

const drawCrispHoles = (
  context: CanvasRenderingContext2D,
  holes: SprocketHole[],
  radius: number,
  holeColor: string | undefined
) => {
  context.save()
  if (holeColor === undefined) {
    context.fillStyle = '#000000'
    context.globalCompositeOperation = 'destination-out'
  } else {
    context.fillStyle = holeColor
  }
  context.beginPath()
  for (const hole of holes) context.roundRect(hole.x, hole.y, hole.width, hole.height, radius)
  context.fill()
  context.restore()
}

interface HoleTexture {
  cellWidth: number
  cellHeight: number
  holeWidth: number
  holeHeight: number
  radius: number
  shortSide: number
  feather: number
  wobble: number
  haloWidth: number
  edgeShadeWidth: number
  tone: RgbColor
  shadeTarget: number
  edgeShade: number
  haloStrength: number
  transparent: boolean
}

/**
 * Rasterises one perforation variant from a signed distance field: a soft, slightly irregular
 * outline, a faint halo on the band and uneven light inside the opening. The fill goes into the
 * first atlas row; for transparent output the second row holds the cut-out mask.
 */
const rasterizeHoleVariant = (image: ImageData, variant: number, texture: HoleTexture) => {
  const random = createSeededRandom(HOLE_TEXTURE_SEED + variant * 7919)
  const jitter = () => (random() - 0.5) * 2
  const width = texture.holeWidth * (1 + jitter() * 0.012)
  const height = texture.holeHeight * (1 + jitter() * 0.012)
  const centerX = texture.cellWidth / 2 + jitter() * texture.shortSide * 0.012
  const centerY = texture.cellHeight / 2 + jitter() * texture.shortSide * 0.012
  const radius = Math.min(texture.radius * (1 + jitter() * 0.1), width / 2, height / 2)
  const phaseA = random() * Math.PI * 2
  const phaseB = random() * Math.PI * 2
  const phaseC = random() * Math.PI * 2
  const gradientAngle = random() * Math.PI * 2
  const gradientX = Math.cos(gradientAngle) / width
  const gradientY = Math.sin(gradientAngle) / height
  const baseShade = 0.01 + random() * 0.06
  const innerHalfWidth = width / 2 - radius
  const innerHalfHeight = height / 2 - radius
  const solidInside = -(texture.wobble + texture.feather + texture.edgeShadeWidth * 4)
  const emptyOutside = texture.wobble + texture.feather + texture.haloWidth * 4
  const [toneRed, toneGreen, toneBlue] = texture.tone
  const maskOffset = image.width * texture.cellHeight * 4

  for (let row = 0; row < texture.cellHeight; row++) {
    const y = row + 0.5 - centerY
    for (let column = 0; column < texture.cellWidth; column++) {
      const x = column + 0.5 - centerX
      const offsetX = Math.abs(x) - innerHalfWidth
      const offsetY = Math.abs(y) - innerHalfHeight
      let distance =
        Math.hypot(Math.max(offsetX, 0), Math.max(offsetY, 0)) +
        Math.min(Math.max(offsetX, offsetY), 0) -
        radius
      if (distance > emptyOutside) continue
      if (distance > solidInside) {
        const angle = Math.atan2(y / height, x / width)
        distance +=
          texture.wobble *
          (0.5 * Math.sin(2 * angle + phaseA) +
            0.35 * Math.sin(3 * angle + phaseB) +
            0.15 * Math.sin(5 * angle + phaseC))
      }

      const pixel = (row * image.width + variant * texture.cellWidth + column) * 4
      const coverage = smoothstep(0.5 - distance / texture.feather)
      const halo =
        texture.haloStrength * Math.exp(-Math.max(distance, 0) / texture.haloWidth) * (1 - coverage)

      if (texture.transparent) {
        image.data[pixel] = toneRed
        image.data[pixel + 1] = toneGreen
        image.data[pixel + 2] = toneBlue
        image.data[pixel + 3] = halo * 255
        image.data[maskOffset + pixel + 3] = coverage * 255
        continue
      }

      const shade = Math.min(
        1,
        Math.max(
          0,
          baseShade +
            0.04 * (x * gradientX + y * gradientY) +
            texture.edgeShade * Math.exp(Math.min(distance, 0) / texture.edgeShadeWidth)
        )
      )
      const alpha = coverage + halo
      if (!alpha) continue
      const mix = (channel: number) =>
        ((channel + (texture.shadeTarget - channel) * shade) * coverage + channel * halo) / alpha
      image.data[pixel] = mix(toneRed)
      image.data[pixel + 1] = mix(toneGreen)
      image.data[pixel + 2] = mix(toneBlue)
      image.data[pixel + 3] = alpha * 255
    }
  }
}

/**
 * Draws textured perforations from a small atlas of variants, so the per-pixel work stays
 * bounded however many holes a long band has.
 */
const drawTexturedHoles = (
  context: CanvasRenderingContext2D,
  holes: SprocketHole[],
  layout: SprocketLayout,
  toneColor: string,
  transparent: boolean
) => {
  const shortSide = Math.min(layout.holeAlong, layout.holeAcross)
  const holeWidth = layout.placement === 'top-bottom' ? layout.holeAlong : layout.holeAcross
  const holeHeight = layout.placement === 'top-bottom' ? layout.holeAcross : layout.holeAlong
  const feather = Math.max(0.8, shortSide * 0.035)
  const wobble = Math.max(0.25, shortSide * 0.012)
  const haloWidth = Math.max(1, shortSide * 0.08)
  const padding = Math.ceil(haloWidth * 4 + feather + wobble + 2)
  const lightHole = isLightColor(toneColor)
  const texture: HoleTexture = {
    cellWidth: Math.ceil(holeWidth * 1.03) + padding * 2,
    cellHeight: Math.ceil(holeHeight * 1.03) + padding * 2,
    holeWidth,
    holeHeight,
    radius: layout.holeRadius,
    shortSide,
    feather,
    wobble,
    haloWidth,
    edgeShadeWidth: Math.max(1, shortSide * 0.12),
    tone: parseHexColor(toneColor),
    shadeTarget: lightHole ? 0 : 255,
    edgeShade: lightHole ? 0.14 : 0.08,
    haloStrength: lightHole ? 0.16 : 0.2,
    transparent
  }
  const variantCount = Math.min(HOLE_VARIANT_COUNT, holes.length)

  const atlas = document.createElement('canvas')
  atlas.width = texture.cellWidth * variantCount
  atlas.height = texture.cellHeight * (transparent ? 2 : 1)
  try {
    const atlasContext = atlas.getContext('2d')
    if (!atlasContext) {
      drawCrispHoles(context, holes, layout.holeRadius, transparent ? undefined : toneColor)
      return
    }
    const image = atlasContext.createImageData(atlas.width, atlas.height)
    for (let variant = 0; variant < variantCount; variant++) {
      rasterizeHoleVariant(image, variant, texture)
    }
    atlasContext.putImageData(image, 0, 0)

    // Holes alternate between the two bands; adjacent holes on a band never share a variant.
    const pickVariant = createSeededRandom(HOLE_TEXTURE_SEED)
    let previousNear = 0
    let previousFar = 0
    const placements = holes.map((hole, index) => {
      const nearBand = index % 2 === 0
      const previous = nearBand ? previousNear : previousFar
      const variant =
        variantCount > 1
          ? (previous + 1 + Math.floor(pickVariant() * (variantCount - 1))) % variantCount
          : 0
      if (nearBand) previousNear = variant
      else previousFar = variant
      return {
        sourceX: variant * texture.cellWidth,
        x: Math.round(hole.x + hole.width / 2 - texture.cellWidth / 2),
        y: Math.round(hole.y + hole.height / 2 - texture.cellHeight / 2)
      }
    })
    const { cellWidth, cellHeight } = texture
    for (const { sourceX, x, y } of placements) {
      context.drawImage(atlas, sourceX, 0, cellWidth, cellHeight, x, y, cellWidth, cellHeight)
    }
    if (transparent) {
      context.save()
      context.globalCompositeOperation = 'destination-out'
      for (const { sourceX, x, y } of placements) {
        context.drawImage(
          atlas,
          sourceX,
          cellHeight,
          cellWidth,
          cellHeight,
          x,
          y,
          cellWidth,
          cellHeight
        )
      }
      context.restore()
    }
  } finally {
    atlas.width = 0
    atlas.height = 0
  }
}

/**
 * Punches the perforations. `holeColor` fills the openings for opaque output; with `transparent`
 * the openings are cut out and the colour only tints the textured halo on the band.
 */
export const drawSprocketHoles = (
  context: CanvasRenderingContext2D,
  output: Pick<CompositionOutputGeometry, 'width' | 'height'>,
  sprocket: Pick<CompositionSprocket, 'placement' | 'width'>,
  options: { holeColor: string; transparent: boolean; textured: boolean }
) => {
  const layout = getSprocketLayout(output, sprocket)
  const holes = getSprocketHoles(layout, output)
  if (!holes.length) return

  if (options.textured) {
    drawTexturedHoles(context, holes, layout, options.holeColor, options.transparent)
  } else {
    drawCrispHoles(
      context,
      holes,
      layout.holeRadius,
      options.transparent ? undefined : options.holeColor
    )
  }
}
