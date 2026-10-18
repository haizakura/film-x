import { getCustomCanvasRatio } from '~/types/canvas'
import {
  FRAME_INFO_LINES,
  FRAME_SHADOW_PRESETS,
  FRAME_TEMPLATES,
  MAX_FRAME_CANVAS_SIDE,
  MIN_FRAME_OUTPUT_SIDE
} from '~/types/frame'
import type {
  FrameCaptionPlacement,
  FrameInfoFields,
  FrameInfoLine,
  FrameLayout,
  FrameRect,
  FrameSettings,
  FrameShadow
} from '~/types/frame'
import { buildFrameFont } from '~/utils/frameFonts'
import type { FrameFontFace } from '~/utils/frameFonts'

export interface FrameLogoAsset {
  source: CanvasImageSource
  aspectRatio: number
  /** Single-colour artwork can be recoloured without losing detail. */
  tintable: boolean
}

export interface FrameCaption {
  tagline: string
  stack: string[]
  left: string[]
  right: string[]
}

export interface FrameScene {
  layout: FrameLayout
  settings: FrameSettings
  caption: FrameCaption
  photo?: CanvasImageSource
  logo?: FrameLogoAsset
  placeholder: string
}

interface Block {
  width: number
  height: number
  draw: (context: CanvasRenderingContext2D, x: number, y: number) => void
}

type StackAlign = 'center' | 'start' | 'end'

interface TextStyle {
  face: FrameFontFace
  size: number
  /** Tracking in em. */
  tracking: number
  uppercase: boolean
  color: string
  alpha: number
}

// Canvas blurs get slow and memory hungry at large radii; render those at reduced resolution.
const MAX_DIRECT_SHADOW_BLUR = 120
const SHADOW_EXTENT = 1.5
const SYMBOL_ASPECT_RATIO = 1.6
const SYMBOL_LOGO_BOOST = 1.7
const LINE_HEIGHT = 1.55
const MAX_STACK_WIDTH = 0.82
const MAX_STACK_HEIGHT = 0.84
const MIN_CAPTION_PADDING = 0.04
const RULE_WIDTH = 0.0012
const RULE_ALPHA = 0.25
// Side captions keep at least this share of the column for text.
const MAX_SIDE_INSET = 0.2
const TAGLINE_TRACKING = 0.32
const SECONDARY_ALPHA = 0.6
const CAPTION_ALPHA = 0.82
const PLACEHOLDER_FONT: FrameFontFace = { font: 'system-sans', bold: false, italic: false }

type FrameCanvasSettings = Pick<
  FrameSettings,
  'border' | 'backdrop' | 'ratioMode' | 'ratio' | 'customRatioWidth' | 'customRatioHeight'
>

/** Requested canvas width-to-height ratio, or undefined when the canvas follows the frame. */
const getFrameCanvasRatio = (settings: FrameCanvasSettings) => {
  if (settings.ratioMode === 'auto') return undefined
  if (settings.ratioMode === 'custom') {
    return getCustomCanvasRatio(settings.customRatioWidth, settings.customRatioHeight)
  }
  return settings.ratio
}

export const getFrameLayout = (
  photoWidth: number,
  photoHeight: number,
  settings: FrameCanvasSettings
): FrameLayout => {
  const unit = Math.sqrt(photoWidth * photoHeight)
  const { top, right, bottom, left } = settings.border
  const padding = settings.backdrop.enabled ? settings.backdrop.padding * unit : 0
  const cardWidth = photoWidth + (left + right) * unit
  const cardHeight = photoHeight + (top + bottom) * unit
  const naturalWidth = cardWidth + padding * 2
  const naturalHeight = cardHeight + padding * 2

  // A canvas ratio only adds centred space around the frame, so the photo is never cropped.
  const ratio = getFrameCanvasRatio(settings)
  let width = naturalWidth
  let height = naturalHeight
  if (ratio !== undefined) {
    if (naturalWidth / naturalHeight < ratio) width = naturalHeight * ratio
    else height = naturalWidth / ratio
  }
  const content = {
    x: (width - naturalWidth) / 2 + padding,
    y: (height - naturalHeight) / 2 + padding,
    width: cardWidth,
    height: cardHeight
  }
  return {
    unit,
    width,
    height,
    card: settings.backdrop.enabled ? content : { x: 0, y: 0, width, height },
    content,
    photo: {
      x: content.x + left * unit,
      y: content.y + top * unit,
      width: photoWidth,
      height: photoHeight
    }
  }
}

/** Rounds a custom output long side into its allowed range; undefined when it is not a number. */
export const clampFrameOutputSide = (value: number) =>
  Number.isFinite(value)
    ? Math.min(MAX_FRAME_CANVAS_SIDE, Math.max(MIN_FRAME_OUTPUT_SIDE, Math.round(value)))
    : undefined

/** Largest scale (never upscaling) that keeps the long side within the limit. */
export const getFrameScale = (layout: FrameLayout, maxSide: number) =>
  Math.min(1, maxSide / Math.max(layout.width, layout.height))

export const getFrameCanvasSize = (layout: FrameLayout, scale: number) => ({
  width: Math.max(1, Math.round(layout.width * scale)),
  height: Math.max(1, Math.round(layout.height * scale))
})

const lineText = (fields: FrameInfoFields, settings: FrameSettings, line: FrameInfoLine) => {
  if (!settings.lines[line]) return ''
  if (line === 'exposure') {
    return [fields.focalLength, fields.aperture, fields.shutter, fields.iso]
      .map((value) => value.trim())
      .filter(Boolean)
      .join('  ')
  }
  return fields[line].trim()
}

const joinParts = (parts: string[]) => parts.filter(Boolean).join('  ·  ')

export const buildFrameCaption = (
  fields: FrameInfoFields,
  settings: FrameSettings
): FrameCaption => {
  const text = (line: FrameInfoLine) => lineText(fields, settings, line)
  const stacked = FRAME_TEMPLATES[settings.template].layout === 'stack'
  return {
    tagline: stacked && settings.showTagline ? settings.tagline.trim() : '',
    stack: FRAME_INFO_LINES.map(text).filter(Boolean),
    left: [text('camera'), text('lens')].filter(Boolean),
    right: [
      joinParts([text('exposure'), text('film')]),
      joinParts([text('date'), text('custom')])
    ].filter(Boolean)
  }
}

const toDevice = (rect: FrameRect, scale: number): FrameRect => {
  const x = Math.round(rect.x * scale)
  const y = Math.round(rect.y * scale)
  return {
    x,
    y,
    width: Math.round((rect.x + rect.width) * scale) - x,
    height: Math.round((rect.y + rect.height) * scale) - y
  }
}

const releaseCanvas = (canvas: HTMLCanvasElement) => {
  canvas.width = 0
  canvas.height = 0
}

/** Draws only the shadow: the shape sits off-canvas and the offset brings its shadow back. */
const castShadow = (
  context: CanvasRenderingContext2D,
  rect: FrameRect,
  blur: number,
  offsetX: number,
  offsetY: number,
  alpha: number
) => {
  const shift = rect.x + rect.width + blur * 4 + 16
  context.save()
  context.shadowColor = `rgba(0,0,0,${alpha})`
  context.shadowBlur = blur
  context.shadowOffsetX = offsetX + shift
  context.shadowOffsetY = offsetY
  context.fillStyle = '#000'
  context.fillRect(rect.x - shift, rect.y, rect.width, rect.height)
  context.restore()
}

const drawShadow = (
  context: CanvasRenderingContext2D,
  rect: FrameRect,
  shadow: FrameShadow,
  unit: number
) => {
  for (const layer of FRAME_SHADOW_PRESETS[shadow.preset]) {
    const alpha = Math.min(1, layer.alpha * shadow.intensity)
    if (alpha <= 0) continue
    const blur = layer.blur * unit
    const offsetX = layer.offsetX * unit
    const offsetY = layer.offsetY * unit
    if (blur <= MAX_DIRECT_SHADOW_BLUR) {
      castShadow(context, rect, blur, offsetX, offsetY, alpha)
      continue
    }

    // A blurred shadow has no fine detail, so a downscaled pass upscales without visible loss.
    const reduction = MAX_DIRECT_SHADOW_BLUR / blur
    const margin = blur * SHADOW_EXTENT
    const region = {
      x: rect.x + offsetX - margin,
      y: rect.y + offsetY - margin,
      width: rect.width + margin * 2,
      height: rect.height + margin * 2
    }
    const layerCanvas = document.createElement('canvas')
    layerCanvas.width = Math.max(1, Math.ceil(region.width * reduction))
    layerCanvas.height = Math.max(1, Math.ceil(region.height * reduction))
    const layerContext = layerCanvas.getContext('2d')
    if (layerContext) {
      castShadow(
        layerContext,
        {
          x: margin * reduction,
          y: margin * reduction,
          width: rect.width * reduction,
          height: rect.height * reduction
        },
        MAX_DIRECT_SHADOW_BLUR,
        0,
        0,
        alpha
      )
      context.save()
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(layerCanvas, region.x, region.y, region.width, region.height)
      context.restore()
    }
    releaseCanvas(layerCanvas)
  }
}

const measureTracked = (context: CanvasRenderingContext2D, text: string, tracking: number) => {
  if (!tracking) return context.measureText(text).width
  const characters = Array.from(text)
  return (
    characters.reduce((width, character) => width + context.measureText(character).width, 0) +
    tracking * Math.max(0, characters.length - 1)
  )
}

// Canvas letterSpacing is not available everywhere, so tracked text is laid out per character.
const fillTracked = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number
) => {
  if (!tracking) {
    context.fillText(text, x, y)
    return
  }
  let cursor = x
  for (const character of Array.from(text)) {
    context.fillText(character, cursor, y)
    cursor += context.measureText(character).width + tracking
  }
}

/** A caption line laid out in a fixed line box, shrunk to fit the available width. */
const textBlock = (
  context: CanvasRenderingContext2D,
  text: string,
  style: TextStyle,
  maxWidth: number
): Block => {
  const content = style.uppercase ? text.toUpperCase() : text
  let size = style.size
  context.font = buildFrameFont(style.face, size)
  let width = measureTracked(context, content, style.tracking * size)
  if (width > maxWidth && width > 0) {
    size *= maxWidth / width
    context.font = buildFrameFont(style.face, size)
    width = measureTracked(context, content, style.tracking * size)
  }
  const height = size * LINE_HEIGHT
  return {
    width,
    height,
    draw: (target, x, y) => {
      target.save()
      target.font = buildFrameFont(style.face, size)
      target.fillStyle = style.color
      target.globalAlpha = style.alpha
      target.textAlign = 'left'
      target.textBaseline = 'middle'
      fillTracked(target, content, x, y + height / 2, style.tracking * size)
      target.restore()
    }
  }
}

/** Wordmark sized by cap height so every font reads at the same logo height. */
const wordmarkBlock = (
  context: CanvasRenderingContext2D,
  scene: FrameScene,
  capHeight: number,
  maxWidth: number
): Block | undefined => {
  const { logo, textColor } = scene.settings
  const raw = logo.wordmark.trim()
  if (!raw) return undefined
  const content = logo.typography.uppercase ? raw.toUpperCase() : raw
  const face = logo.typography
  context.font = buildFrameFont(face, 100)
  const capRatio = context.measureText('H').actualBoundingBoxAscent / 100 || 0.7
  let size = capHeight / capRatio
  context.font = buildFrameFont(face, size)
  let width = measureTracked(context, content, logo.typography.letterSpacing * size)
  if (width > maxWidth && width > 0) {
    size *= maxWidth / width
    context.font = buildFrameFont(face, size)
    width = measureTracked(context, content, logo.typography.letterSpacing * size)
  }
  const metrics = context.measureText(content)
  const ascent = metrics.actualBoundingBoxAscent
  const height = ascent + metrics.actualBoundingBoxDescent
  const color = logo.colorMode === 'custom' ? logo.color : textColor
  return {
    width,
    height,
    draw: (target, x, y) => {
      target.save()
      target.font = buildFrameFont(face, size)
      target.fillStyle = color
      target.textAlign = 'left'
      target.textBaseline = 'alphabetic'
      fillTracked(target, content, x, y + ascent, logo.typography.letterSpacing * size)
      target.restore()
    }
  }
}

const drawTinted = (
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  rect: FrameRect,
  color: string
) => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(rect.width))
  canvas.height = Math.max(1, Math.ceil(rect.height))
  const tintContext = canvas.getContext('2d')
  if (tintContext) {
    tintContext.drawImage(source, 0, 0, canvas.width, canvas.height)
    tintContext.globalCompositeOperation = 'source-in'
    tintContext.fillStyle = color
    tintContext.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(canvas, rect.x, rect.y, rect.width, rect.height)
  } else {
    context.drawImage(source, rect.x, rect.y, rect.width, rect.height)
  }
  releaseCanvas(canvas)
}

const logoBlock = (
  context: CanvasRenderingContext2D,
  scene: FrameScene,
  height: number,
  maxWidth: number
): Block | undefined => {
  const { logo, textColor } = scene.settings
  if (logo.style === 'none') return undefined
  if (logo.style === 'wordmark') return wordmarkBlock(context, scene, height, maxWidth)
  const asset = scene.logo
  if (!asset) return undefined

  let logoHeight = asset.aspectRatio < SYMBOL_ASPECT_RATIO ? height * SYMBOL_LOGO_BOOST : height
  let logoWidth = logoHeight * asset.aspectRatio
  if (logoWidth > maxWidth) {
    logoHeight *= maxWidth / logoWidth
    logoWidth = maxWidth
  }
  const tint =
    asset.tintable && logo.colorMode !== 'original'
      ? logo.colorMode === 'text'
        ? textColor
        : logo.color
      : undefined
  return {
    width: logoWidth,
    height: logoHeight,
    draw: (target, x, y) => {
      const rect = { x, y, width: logoWidth, height: logoHeight }
      target.save()
      target.imageSmoothingEnabled = true
      target.imageSmoothingQuality = 'high'
      if (tint) drawTinted(target, asset.source, rect, tint)
      else target.drawImage(asset.source, x, y, logoWidth, logoHeight)
      target.restore()
    }
  }
}

/** Stacked caption; start and end align to an inset from the column edges. */
const drawStack = (
  context: CanvasRenderingContext2D,
  scene: FrameScene,
  area: FrameRect,
  unit: number,
  align: StackAlign,
  inset: number
) => {
  const { settings, caption } = scene
  const spec = FRAME_TEMPLATES[settings.template]
  const maxWidth = align === 'center' ? area.width * MAX_STACK_WIDTH : area.width - inset * 2
  if (maxWidth <= 0) return
  const textFace = settings.text
  const blockX = (width: number) =>
    align === 'start'
      ? area.x + inset
      : align === 'end'
        ? area.x + area.width - inset - width
        : area.x + (area.width - width) / 2

  const build = (factor: number) => {
    const items: Array<{ block: Block; gap: number }> = []
    const logoHeight = spec.logoHeight * unit * settings.logo.scale * factor
    const taglineSize = spec.taglineSize * unit * settings.textScale * factor
    const textSize = spec.textSize * unit * settings.textScale * factor
    const logo = logoBlock(context, scene, logoHeight, maxWidth)
    if (logo) items.push({ block: logo, gap: 0 })
    if (caption.tagline) {
      items.push({
        block: textBlock(
          context,
          caption.tagline,
          {
            face: { font: textFace.font, bold: false, italic: textFace.italic },
            size: taglineSize,
            tracking: TAGLINE_TRACKING,
            uppercase: true,
            color: settings.textColor,
            alpha: CAPTION_ALPHA
          },
          maxWidth
        ),
        gap: logo ? logoHeight * 0.42 : 0
      })
    }
    caption.stack.forEach((line, index) => {
      const gap = index > 0 ? 0 : caption.tagline ? taglineSize * 1.8 : logo ? logoHeight * 0.65 : 0
      items.push({
        block: textBlock(
          context,
          line,
          {
            face: textFace,
            size: textSize,
            tracking: textFace.letterSpacing,
            uppercase: textFace.uppercase,
            color: settings.textColor,
            alpha: CAPTION_ALPHA
          },
          maxWidth
        ),
        gap
      })
    })
    return items
  }

  const totalHeight = (items: Array<{ block: Block; gap: number }>) =>
    items.reduce((sum, item) => sum + item.gap + item.block.height, 0)

  let items = build(1)
  const height = totalHeight(items)
  if (!height) return
  const factor = Math.min(1, (area.height * MAX_STACK_HEIGHT) / height)
  if (factor < 1) items = build(factor)

  let y = area.y + (area.height - totalHeight(items)) / 2
  for (const { block, gap } of items) {
    y += gap
    block.draw(context, blockX(block.width), y)
    y += block.height
  }
}

/** Bar caption lines: a bold first line over smaller, lighter secondary lines. */
const barColumn = (
  context: CanvasRenderingContext2D,
  settings: FrameSettings,
  lines: string[],
  textSize: number,
  maxWidth: number
) =>
  lines.map((line, index) =>
    textBlock(
      context,
      line,
      {
        face: index === 0 ? { ...settings.text, bold: true } : settings.text,
        size: index === 0 ? textSize * 1.1 : textSize * 0.85,
        tracking: settings.text.letterSpacing,
        uppercase: settings.text.uppercase,
        color: settings.textColor,
        alpha: index === 0 ? 1 : SECONDARY_ALPHA
      },
      maxWidth
    )
  )

const columnWidth = (blocks: Block[]) => Math.max(0, ...blocks.map((block) => block.width))
const columnHeight = (blocks: Block[]) => blocks.reduce((sum, block) => sum + block.height, 0)

/** Horizontal bounds of a bar's content, inset by the side borders. */
const barInner = (settings: FrameSettings, area: FrameRect, unit: number) => {
  const left = area.x + Math.max(settings.border.left, MIN_CAPTION_PADDING) * unit
  const right = area.x + area.width - Math.max(settings.border.right, MIN_CAPTION_PADDING) * unit
  return { x: left, width: right - left }
}

const drawSplit = (
  context: CanvasRenderingContext2D,
  scene: FrameScene,
  area: FrameRect,
  unit: number
) => {
  const { settings, caption } = scene
  const spec = FRAME_TEMPLATES[settings.template]
  const { x: innerX, width: innerWidth } = barInner(settings, area, unit)
  if (innerWidth <= 0) return

  const build = (factor: number, maxWidth: number) => {
    const textSize = spec.textSize * unit * settings.textScale * factor
    const left = barColumn(context, settings, caption.left, textSize, maxWidth)
    const right = barColumn(context, settings, caption.right, textSize, maxWidth)
    const logo = logoBlock(
      context,
      scene,
      spec.logoHeight * unit * settings.logo.scale * factor,
      maxWidth * 0.4
    )
    const gap = 0.022 * unit * factor
    const rightTextWidth = columnWidth(right)
    const dividerWidth = Math.max(1, RULE_WIDTH * unit)
    const divided = Boolean(logo && right.length)
    const rightWidth = (logo?.width ?? 0) + (divided ? gap * 2 + dividerWidth : 0) + rightTextWidth
    return {
      left,
      right,
      logo,
      gap,
      dividerWidth,
      divided,
      leftWidth: columnWidth(left),
      rightWidth,
      rightTextWidth
    }
  }

  // Fit both columns to the bar from their natural sizes, then lay out once at that scale.
  const natural = build(1, Number.POSITIVE_INFINITY)
  const required =
    natural.leftWidth + natural.rightWidth + (natural.leftWidth ? natural.gap * 2 : 0)
  const height = Math.max(
    columnHeight(natural.left),
    columnHeight(natural.right),
    natural.logo?.height ?? 0
  )
  if (!required || !height) return
  const factor = Math.min(1, innerWidth / required, (area.height * MAX_STACK_HEIGHT) / height)
  const parts = build(factor, innerWidth)

  const centerY = area.y + area.height / 2
  const drawColumn = (blocks: Block[], x: number) => {
    let y = centerY - columnHeight(blocks) / 2
    for (const block of blocks) {
      block.draw(context, x, y)
      y += block.height
    }
  }

  drawColumn(parts.left, innerX)
  let x = innerX + innerWidth - parts.rightWidth
  if (parts.logo) {
    parts.logo.draw(context, x, centerY - parts.logo.height / 2)
    x += parts.logo.width
  }
  if (parts.divided) {
    x += parts.gap
    const dividerHeight = Math.max(columnHeight(parts.right), parts.logo?.height ?? 0)
    context.save()
    context.fillStyle = settings.textColor
    context.globalAlpha = RULE_ALPHA
    context.fillRect(x, centerY - dividerHeight / 2, parts.dividerWidth, dividerHeight)
    context.restore()
    x += parts.dividerWidth + parts.gap
  }
  drawColumn(parts.right, x)
}

/** Logo at the left edge of the bar, every caption line right-aligned at the other. */
const drawBar = (
  context: CanvasRenderingContext2D,
  scene: FrameScene,
  area: FrameRect,
  unit: number
) => {
  const { settings, caption } = scene
  const spec = FRAME_TEMPLATES[settings.template]
  const { x: innerX, width: innerWidth } = barInner(settings, area, unit)
  if (innerWidth <= 0) return
  const lines = [...caption.left, ...caption.right]

  const build = (factor: number, maxWidth: number) => {
    const textSize = spec.textSize * unit * settings.textScale * factor
    const info = barColumn(context, settings, lines, textSize, maxWidth)
    const logo = logoBlock(
      context,
      scene,
      spec.logoHeight * unit * settings.logo.scale * factor,
      maxWidth * 0.5
    )
    const gap = logo && info.length ? 0.04 * unit * factor : 0
    return { info, logo, width: (logo?.width ?? 0) + gap + columnWidth(info) }
  }

  const natural = build(1, Number.POSITIVE_INFINITY)
  const height = Math.max(columnHeight(natural.info), natural.logo?.height ?? 0)
  if (!natural.width || !height) return
  const factor = Math.min(1, innerWidth / natural.width, (area.height * MAX_STACK_HEIGHT) / height)
  const { info, logo } = build(factor, innerWidth)

  const centerY = area.y + area.height / 2
  if (logo) logo.draw(context, innerX, centerY - logo.height / 2)
  let y = centerY - columnHeight(info) / 2
  for (const block of info) {
    block.draw(context, innerX + innerWidth - block.width, y)
    y += block.height
  }
}

const drawPlaceholder = (
  context: CanvasRenderingContext2D,
  rect: FrameRect,
  label: string,
  unit: number
) => {
  const gradient = context.createLinearGradient(
    rect.x,
    rect.y,
    rect.x + rect.width,
    rect.y + rect.height
  )
  gradient.addColorStop(0, '#DAD6CE')
  gradient.addColorStop(1, '#B9B4AA')
  context.save()
  context.fillStyle = gradient
  context.fillRect(rect.x, rect.y, rect.width, rect.height)
  context.font = buildFrameFont(PLACEHOLDER_FONT, 0.03 * unit)
  context.fillStyle = 'rgba(40,36,30,.5)'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width * 0.9)
  context.restore()
}

/**
 * Side caption behind a rule the height of the photo: the logo over both bar caption groups,
 * aligned toward the rule and bottom-aligned with the photo. The inset is the outer margin.
 */
const drawSideColumn = (
  context: CanvasRenderingContext2D,
  scene: FrameScene,
  area: FrameRect,
  unit: number,
  align: Exclude<StackAlign, 'center'>,
  inset: number
) => {
  const { settings, caption } = scene
  const spec = FRAME_TEMPLATES[settings.template]
  const spacing = settings.columnSpacing
  const ruleWidth = Math.max(1, RULE_WIDTH * unit)
  const photoGap = spacing.photo * unit
  const textGap = spacing.text * unit
  const maxWidth = area.width - photoGap - ruleWidth - textGap - inset
  if (maxWidth <= 0) return
  const groups = [caption.left, caption.right].filter((lines) => lines.length)

  const build = (factor: number, width: number) => {
    const logoHeight = spec.logoHeight * unit * settings.logo.scale * factor
    const textSize = spec.textSize * unit * settings.textScale * factor
    const items: Array<{ block: Block; gap: number }> = []
    const logo = logoBlock(context, scene, logoHeight, width)
    if (logo) items.push({ block: logo, gap: 0 })
    groups.forEach((lines, group) => {
      barColumn(context, settings, lines, textSize, width).forEach((block, line) => {
        const gap =
          line > 0 ? 0 : (group > 0 ? spacing.group : logo ? spacing.logo : 0) * unit * factor
        items.push({ block, gap })
      })
    })
    return items
  }
  const totalHeight = (items: Array<{ block: Block; gap: number }>) =>
    items.reduce((sum, item) => sum + item.gap + item.block.height, 0)

  const natural = build(1, Number.POSITIVE_INFINITY)
  const naturalWidth = Math.max(0, ...natural.map((item) => item.block.width))
  const naturalHeight = totalHeight(natural)
  if (!naturalWidth || !naturalHeight) return
  const factor = Math.min(
    1,
    maxWidth / naturalWidth,
    (area.height * MAX_STACK_HEIGHT) / naturalHeight
  )
  const items = build(factor, maxWidth)

  const ruleX = align === 'start' ? area.x + photoGap : area.x + area.width - photoGap - ruleWidth
  context.save()
  context.fillStyle = settings.textColor
  context.globalAlpha = RULE_ALPHA
  context.fillRect(ruleX, area.y, ruleWidth, area.height)
  context.restore()

  const textEdge = align === 'start' ? ruleX + ruleWidth + textGap : ruleX - textGap
  let y = area.y + area.height - totalHeight(items)
  for (const { block, gap } of items) {
    y += gap
    block.draw(context, align === 'start' ? textEdge : textEdge - block.width, y)
    y += block.height
  }
}

/** Region beside the photo that holds the caption; side captions centre on the photo. */
const getCaptionArea = (
  card: FrameRect,
  photo: FrameRect,
  placement: FrameCaptionPlacement
): FrameRect => {
  const photoRight = photo.x + photo.width
  if (placement === 'left') {
    return { x: card.x, y: photo.y, width: photo.x - card.x, height: photo.height }
  }
  if (placement === 'right') {
    return {
      x: photoRight,
      y: photo.y,
      width: card.x + card.width - photoRight,
      height: photo.height
    }
  }
  return {
    x: card.x,
    y: photo.y + photo.height,
    width: card.width,
    height: card.y + card.height - (photo.y + photo.height)
  }
}

/** Renders the whole frame; the canvas must already be sized with getFrameCanvasSize. */
export const drawFrame = (context: CanvasRenderingContext2D, scene: FrameScene, scale: number) => {
  const { layout, settings } = scene
  const unit = layout.unit * scale
  const size = getFrameCanvasSize(layout, scale)
  const card = toDevice(layout.card, scale)
  const content = toDevice(layout.content, scale)
  const photo = toDevice(layout.photo, scale)

  context.save()
  context.fillStyle = settings.backdrop.enabled ? settings.backdrop.color : settings.frameColor
  context.fillRect(0, 0, size.width, size.height)
  if (settings.backdrop.enabled) {
    drawShadow(context, card, settings.backdrop.shadow, unit)
    context.fillStyle = settings.frameColor
    context.fillRect(card.x, card.y, card.width, card.height)
  }

  // The photo rests on the card, so its shadow never spills onto the backdrop.
  context.save()
  context.beginPath()
  context.rect(card.x, card.y, card.width, card.height)
  context.clip()
  drawShadow(context, photo, settings.photoShadow, unit)
  context.restore()

  context.fillStyle = settings.frameColor
  context.fillRect(photo.x, photo.y, photo.width, photo.height)
  if (scene.photo) {
    context.save()
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(scene.photo, photo.x, photo.y, photo.width, photo.height)
    context.restore()
  } else {
    drawPlaceholder(context, photo, scene.placeholder, unit)
  }

  const spec = FRAME_TEMPLATES[settings.template]
  const area = getCaptionArea(content, photo, spec.placement)
  if (area.width >= 1 && area.height >= 1) {
    context.save()
    context.beginPath()
    context.rect(card.x, card.y, card.width, card.height)
    context.clip()
    // Side captions align toward the photo, spaced like its opposite border.
    const outer = spec.placement === 'right' ? settings.border.left : settings.border.right
    const inset = Math.min(Math.max(outer, MIN_CAPTION_PADDING) * unit, area.width * MAX_SIDE_INSET)
    const sideAlign = spec.placement === 'right' ? 'start' : 'end'
    if (spec.layout === 'split') {
      drawSplit(context, scene, area, unit)
    } else if (spec.layout === 'bar') {
      drawBar(context, scene, area, unit)
    } else if (spec.layout === 'column') {
      drawSideColumn(context, scene, area, unit, sideAlign, inset)
    } else if (spec.placement === 'bottom') {
      drawStack(context, scene, area, unit, 'center', 0)
    } else {
      drawStack(context, scene, area, unit, sideAlign, inset)
    }
    context.restore()
  }
  context.restore()
}

/** Font faces the scene draws with, so callers can load them before rendering. */
export const getFrameSceneFonts = (settings: FrameSettings): FrameFontFace[] => {
  const faces: FrameFontFace[] = [
    settings.text,
    { font: settings.text.font, bold: false, italic: settings.text.italic }
  ]
  if (FRAME_TEMPLATES[settings.template].layout !== 'stack') {
    faces.push({ font: settings.text.font, bold: true, italic: settings.text.italic })
  }
  if (settings.logo.style === 'wordmark') faces.push(settings.logo.typography)
  return faces
}
