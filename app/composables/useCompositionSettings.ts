import type { ShallowRef } from 'vue'

import type {
  CompositionGeometry,
  CompositionImage,
  CompositionSettings
} from '~/types/composition'

const CANVAS_WIDTH = 2400
const AUTO_FRAME_WIDTH = 1064
const DEFAULT_FRAME_RATIO = 2 / 3
const MIN_RATIO = 0.2
const MAX_RATIO = 5

const clampRatio = (value: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, value))

export const useCompositionSettings = (images: ShallowRef<Array<CompositionImage | undefined>>) => {
  const settings = ref<CompositionSettings>({
    ratioMode: 'preset',
    ratio: 4 / 5,
    customRatioWidth: 4,
    customRatioHeight: 5,
    layoutDirection: 'horizontal',
    background: '#E9E4DA',
    pattern: 'none',
    fit: 'cover',
    padding: { top: 112, right: 112, bottom: 112, left: 112 },
    gap: 48,
    outputFormat: 'jpeg',
    outputQuality: 0.92
  })

  const customRatio = computed(() => {
    const width = Number(settings.value.customRatioWidth)
    const height = Number(settings.value.customRatioHeight)
    return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? clampRatio(width / height)
      : 1
  })

  const commonFrameRatio = computed(() => {
    const loadedRatios = images.value.flatMap((entry) =>
      entry ? [clampRatio(entry.decoded.width / entry.decoded.height)] : []
    )
    if (!loadedRatios.length) return DEFAULT_FRAME_RATIO
    return loadedRatios.reduce((sum, value) => sum + value, 0) / loadedRatios.length
  })

  const geometry = computed<CompositionGeometry>(() => {
    const { top, right, bottom, left } = settings.value.padding
    const { gap, layoutDirection, ratioMode } = settings.value
    const horizontal = layoutDirection === 'horizontal'

    if (ratioMode === 'auto') {
      const frameWidth = AUTO_FRAME_WIDTH
      const frameHeight = Math.max(1, Math.round(frameWidth / commonFrameRatio.value))
      const width = horizontal ? left + right + frameWidth * 2 + gap : left + right + frameWidth
      const height = horizontal ? top + bottom + frameHeight : top + bottom + frameHeight * 2 + gap
      const frames = [0, 1].map((index) => ({
        x: horizontal ? left + index * (frameWidth + gap) : left,
        y: horizontal ? top : top + index * (frameHeight + gap),
        width: frameWidth,
        height: frameHeight
      }))
      return { width, height, frames }
    }

    const selectedRatio = ratioMode === 'custom' ? customRatio.value : settings.value.ratio
    const width = CANVAS_WIDTH
    const height = Math.max(1, Math.round(width / selectedRatio))
    const frameWidth = horizontal
      ? Math.max(1, (width - left - right - gap) / 2)
      : Math.max(1, width - left - right)
    const frameHeight = horizontal
      ? Math.max(1, height - top - bottom)
      : Math.max(1, (height - top - bottom - gap) / 2)
    const frames = [0, 1].map((index) => ({
      x: horizontal ? left + index * (frameWidth + gap) : left,
      y: horizontal ? top : top + index * (frameHeight + gap),
      width: frameWidth,
      height: frameHeight
    }))
    return { width, height, frames }
  })

  const aspectStyle = computed(() => ({
    aspectRatio: `${geometry.value.width} / ${geometry.value.height}`
  }))

  return { settings, geometry, aspectStyle }
}
