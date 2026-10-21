import type { CanvasRatioMode } from '~/types/canvas'
import { normalizeHexColor } from '~/utils/color'

export type Raw = Record<string, unknown>

/** Every member of a string union, checked for completeness by the record keys. */
export const options = <T extends string>(members: Record<T, true>) => Object.keys(members) as T[]

export const RATIO_MODES = options<CanvasRatioMode>({ preset: true, custom: true, auto: true })
export const OUTPUT_FORMATS = options<'jpeg' | 'png' | 'webp'>({
  jpeg: true,
  png: true,
  webp: true
})

export const isRecord = (value: unknown): value is Raw =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
export const record = (value: unknown): Raw => (isRecord(value) ? value : {})
export const find = <T extends string | number>(value: unknown, allowed: readonly T[]) =>
  allowed.find((option) => option === value)
export const pick = <T extends string | number>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T => find(value, allowed) ?? fallback
export const flag = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback
export const number = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback
export const color = (value: unknown, fallback: string) =>
  (typeof value === 'string' && normalizeHexColor(value)) || fallback
