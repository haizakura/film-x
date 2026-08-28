import type { DecodedImage, SplitDetectionResult } from '~/types/image'

const ANALYSIS_MAX_WIDTH = 900
const ANALYSIS_MAX_HEIGHT = 600
const SEARCH_START = 0.4
const SEARCH_END = 0.6
const MAX_GAP = 0.08

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const smooth = (values: number[], radius: number) => {
  const prefix = makePrefix(values)
  return values.map((_, index) => {
    const start = Math.max(0, index - radius)
    const end = Math.min(values.length, index + radius + 1)
    return rangeMean(prefix, start, end)
  })
}

const makePrefix = (values: number[]) => {
  const prefix = new Array<number>(values.length + 1).fill(0)
  for (let index = 0; index < values.length; index += 1) {
    prefix[index + 1] = (prefix[index] ?? 0) + (values[index] ?? 0)
  }
  return prefix
}

const rangeMean = (prefix: number[], start: number, end: number) =>
  ((prefix[end] ?? 0) - (prefix[start] ?? 0)) / Math.max(1, end - start)

const percentile = (values: number[], ratio: number) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.round((sorted.length - 1) * ratio)] ?? 0
}

interface ColumnProfiles {
  luminance: number[]
  activity: number[]
}

const readColumnProfiles = (image: DecodedImage): ColumnProfiles | undefined => {
  const scale = Math.min(1, ANALYSIS_MAX_WIDTH / image.width, ANALYSIS_MAX_HEIGHT / image.height)
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) return

  context.drawImage(image.source, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height).data
  const startY = Math.floor(height * 0.06)
  const endY = Math.max(startY + 1, Math.ceil(height * 0.94))
  const luminance = new Array<number>(width).fill(0)
  const activity = new Array<number>(width).fill(0)

  for (let x = 0; x < width; x += 1) {
    let sum = 0
    let squaredSum = 0
    let verticalDifference = 0
    let previous = -1

    for (let y = startY; y < endY; y += 1) {
      const offset = (y * width + x) * 4
      const value =
        (pixels[offset] ?? 0) * 0.2126 +
        (pixels[offset + 1] ?? 0) * 0.7152 +
        (pixels[offset + 2] ?? 0) * 0.0722
      sum += value
      squaredSum += value * value
      if (previous >= 0) verticalDifference += Math.abs(value - previous)
      previous = value
    }

    const samples = endY - startY
    const mean = sum / samples
    const deviation = Math.sqrt(Math.max(0, squaredSum / samples - mean * mean))
    luminance[x] = mean
    activity[x] = deviation + verticalDifference / Math.max(1, samples - 1)
  }

  canvas.width = 0
  canvas.height = 0

  return {
    luminance: smooth(luminance, 1),
    activity: smooth(activity, 2)
  }
}

/**
 * Finds the vertically consistent strip between two half frames. The detector uses
 * brightness contrast and texture loss together, so it works with both dark and
 * light scanner gutters without sending the image off-device.
 */
export const detectSplit = (image: DecodedImage): SplitDetectionResult => {
  const profiles = readColumnProfiles(image)
  if (!profiles || profiles.luminance.length < 24) {
    return { center: 0.5, gap: 0, confidence: 0 }
  }

  const { luminance, activity } = profiles
  const width = luminance.length
  const searchStart = Math.max(2, Math.floor(width * SEARCH_START))
  const searchEnd = Math.min(width - 2, Math.ceil(width * SEARCH_END))
  const minGap = Math.max(2, Math.round(width * 0.002))
  const maxGap = Math.max(minGap, Math.round(width * MAX_GAP))
  const boundaryBand = Math.max(2, Math.round(width * 0.008))
  const luminancePrefix = makePrefix(luminance)
  const luminanceSquarePrefix = makePrefix(luminance.map((value) => value * value))
  const activityPrefix = makePrefix(activity)
  const activityLow = percentile(activity, 0.15)
  const activityHigh = percentile(activity, 0.8)
  const activityScale = Math.max(8, activityHigh - activityLow)

  let bestScore = Number.NEGATIVE_INFINITY
  let bestLeft = Math.round(width * 0.5)
  let bestRight = bestLeft

  for (let left = searchStart; left <= searchEnd - minGap; left += 1) {
    const rightLimit = Math.min(searchEnd, left + maxGap)

    for (let right = left + minGap; right <= rightLimit; right += 1) {
      const center = (left + right) / 2
      const innerMean = rangeMean(luminancePrefix, left, right)
      const innerActivity = rangeMean(activityPrefix, left, right)
      const innerSquareMean = rangeMean(luminanceSquarePrefix, left, right)
      const innerDeviation = Math.sqrt(Math.max(0, innerSquareMean - innerMean * innerMean))
      const leftStart = Math.max(0, left - boundaryBand)
      const rightEnd = Math.min(width, right + boundaryBand)
      const leftMean = rangeMean(luminancePrefix, leftStart, left)
      const rightMean = rangeMean(luminancePrefix, right, rightEnd)
      const outerActivity =
        (rangeMean(activityPrefix, leftStart, left) + rangeMean(activityPrefix, right, rightEnd)) /
        2
      const leftContrast = Math.abs(innerMean - leftMean) / 255
      const rightContrast = Math.abs(innerMean - rightMean) / 255
      const contrastMean = (leftContrast + rightContrast) / 2
      const contrastMin = Math.min(leftContrast, rightContrast)
      const textureDrop = (outerActivity - innerActivity) / activityScale
      const boundaryStrength =
        (Math.abs((luminance[left - 1] ?? innerMean) - (luminance[left] ?? innerMean)) +
          Math.abs((luminance[right - 1] ?? innerMean) - (luminance[right] ?? innerMean))) /
        510
      const centerPenalty = Math.abs(center / width - 0.5) * 0.55
      const uniformityPenalty = (innerDeviation / 255) * 0.45
      const score =
        contrastMean * 1.05 +
        contrastMin * 1.25 +
        clamp(textureDrop, -0.3, 1) * 0.7 +
        boundaryStrength * 0.7 -
        centerPenalty -
        uniformityPenalty

      if (score > bestScore) {
        bestScore = score
        bestLeft = left
        bestRight = right
      }
    }
  }

  const confidence = clamp((bestScore - 0.12) / 0.62, 0, 1)
  if (confidence >= 0.2) {
    return {
      center: Number(((bestLeft + bestRight) / 2 / width).toFixed(4)),
      gap: Number(((bestRight - bestLeft) / width).toFixed(4)),
      confidence: Number(confidence.toFixed(3))
    }
  }

  // When no visible gutter exists, choose the quietest narrow seam but remove no pixels.
  const fallbackSearchStart = Math.max(searchStart, Math.floor(width * 0.46))
  const fallbackSearchEnd = Math.min(searchEnd, Math.ceil(width * 0.54))
  const fallbackRadius = Math.max(1, Math.round(width * 0.004))
  const activityWindow = makePrefix(activity)
  let fallbackCenter = Math.round(width * 0.5)
  let fallbackScore = Number.POSITIVE_INFINITY

  for (let x = fallbackSearchStart; x <= fallbackSearchEnd; x += 1) {
    const start = Math.max(0, x - fallbackRadius)
    const end = Math.min(width, x + fallbackRadius + 1)
    const score =
      rangeMean(activityWindow, start, end) / Math.max(1, activityHigh) +
      Math.abs(x / width - 0.5) * 1.2
    if (score < fallbackScore) {
      fallbackScore = score
      fallbackCenter = x
    }
  }

  return {
    center: Number((fallbackCenter / width).toFixed(4)),
    gap: 0,
    confidence: Number(confidence.toFixed(3))
  }
}
