export type CanvasRatioMode = 'preset' | 'custom' | 'auto'

export const MIN_CANVAS_RATIO = 0.2
export const MAX_CANVAS_RATIO = 5

// Largest term of a custom ratio such as 16:9.
export const MAX_CANVAS_RATIO_TERM = 99

export const CANVAS_RATIO_PRESETS = [
  { label: '4:5', value: 4 / 5 },
  { label: '1:1', value: 1 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 }
] as const

export const clampCanvasRatio = (value: number) =>
  Math.min(MAX_CANVAS_RATIO, Math.max(MIN_CANVAS_RATIO, value))

/** Width-to-height ratio of a custom canvas; 1 until both inputs are positive numbers. */
export const getCustomCanvasRatio = (width: number | string, height: number | string) => {
  const w = Number(width)
  const h = Number(height)
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? clampCanvasRatio(w / h) : 1
}
