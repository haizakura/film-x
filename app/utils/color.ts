export type RgbColor = [red: number, green: number, blue: number]

export const normalizeHexColor = (value: string) => {
  const hex = value.trim().replace(/^#/, '')
  return /^[\dA-Fa-f]{6}$/.test(hex) ? `#${hex.toUpperCase()}` : undefined
}

export const parseHexColor = (hex: string): RgbColor => {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16) || 0,
    Number.parseInt(value.slice(2, 4), 16) || 0,
    Number.parseInt(value.slice(4, 6), 16) || 0
  ]
}

export const isLightColor = (hex: string) => {
  const [red, green, blue] = parseHexColor(hex)
  return red * 0.299 + green * 0.587 + blue * 0.114 > 145
}
