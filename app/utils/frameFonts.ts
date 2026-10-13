import { FRAME_FONTS } from '~/types/frame'
import type { FrameFontCategory, FrameFontId, FrameTypography } from '~/types/frame'

export type FrameFontFace = Pick<FrameTypography, 'font' | 'bold' | 'italic'>

const CJK_SANS = '"PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", sans-serif'
const CJK_SERIF = '"Songti SC", "Noto Serif CJK SC", serif'

// Bundled fonts only cover Latin, so CJK captions fall back to a matching system face.
const FONT_FALLBACKS: Record<FrameFontCategory, string> = {
  serif: CJK_SERIF,
  sans: CJK_SANS,
  mono: `ui-monospace, Menlo, ${CJK_SANS}`,
  script: `"Kaiti SC", STKaiti, ${CJK_SERIF}`,
  system: ''
}

export const getFrameFontFamily = (font: FrameFontId) => {
  const spec = FRAME_FONTS[font]
  const fallback = FONT_FALLBACKS[spec.category]
  return fallback ? `${spec.family}, ${fallback}` : spec.family
}

export const getFrameFontWeight = (face: FrameFontFace) => {
  const spec = FRAME_FONTS[face.font]
  return face.bold && spec.bold ? spec.bold : spec.regular
}

export const isFrameFontItalic = (face: FrameFontFace) =>
  face.italic && FRAME_FONTS[face.font].italic

const fontDescriptor = (face: FrameFontFace) =>
  `${isFrameFontItalic(face) ? 'italic ' : ''}${getFrameFontWeight(face)}`

export const buildFrameFont = (face: FrameFontFace, size: number) =>
  `${fontDescriptor(face)} ${Math.max(1, size).toFixed(2)}px ${getFrameFontFamily(face.font)}`

const fontLoads = new Map<string, Promise<void>>()
const readyFonts = new Set<string>()

const loadKey = (face: FrameFontFace) =>
  `${fontDescriptor(face)} 32px ${FRAME_FONTS[face.font].family}`

export const isFrameFontReady = (face: FrameFontFace) =>
  FRAME_FONTS[face.font].category === 'system' || readyFonts.has(loadKey(face))

/** Loads a bundled face once; failures settle too so drawing falls back to system fonts. */
export const loadFrameFont = (face: FrameFontFace) => {
  if (FRAME_FONTS[face.font].category === 'system') return Promise.resolve()
  const key = loadKey(face)
  let pending = fontLoads.get(key)
  if (!pending) {
    const settle = () => {
      readyFonts.add(key)
    }
    pending = document.fonts.load(key).then(settle, settle)
    fontLoads.set(key, pending)
  }
  return pending
}

export const loadFrameFonts = async (faces: FrameFontFace[]) => {
  await Promise.all(faces.map(loadFrameFont))
}
