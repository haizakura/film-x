<script setup lang="ts">
import { FRAME_TEMPLATES } from '~/types/frame'
import type { FrameTemplate, FrameTemplateSpec } from '~/types/frame'

const model = defineModel<FrameTemplate>({ required: true })
const { t } = useI18n()

const TEMPLATES: FrameTemplate[] = [
  'polaroid',
  'gallery',
  'float',
  'strip',
  'bar',
  'photoLeft',
  'photoRight',
  'column'
]
// Schematic of a 3:2 photo using the same relative border math as the renderer.
const PHOTO_WIDTH = 36
const PHOTO_HEIGHT = 24
const UNIT = Math.sqrt(PHOTO_WIDTH * PHOTO_HEIGHT)
const BACKDROP_PADDING = 0.12
// Side columns are narrower than the bottom area, so their rows are drawn shorter.
const SIDE_ROW_SCALE = 0.5

interface Bar {
  x: number
  y: number
  width: number
  height: number
  strong?: boolean
}

interface Row {
  width: number
  height: number
  gap: number
  strong?: boolean
}

const stackRows = (spec: FrameTemplateSpec, scale: number) => {
  const rows: Row[] = [{ width: 14 * scale, height: 1.6, gap: 0, strong: true }]
  if (spec.showTagline) rows.push({ width: 9 * scale, height: 0.7, gap: 0.8 })
  if (spec.showInfo) {
    rows.push(
      { width: 10 * scale, height: 0.7, gap: 1.6 },
      { width: 12 * scale, height: 0.7, gap: 0.7 },
      { width: 8 * scale, height: 0.7, gap: 0.7 }
    )
  }
  return rows
}

const schematics = computed(() =>
  TEMPLATES.map((id) => {
    const spec = FRAME_TEMPLATES[id]
    const padding = spec.backdrop ? BACKDROP_PADDING * UNIT : 0
    const top = spec.border.top * UNIT
    const right = spec.border.right * UNIT
    const bottom = spec.border.bottom * UNIT
    const left = spec.border.left * UNIT
    const cardWidth = PHOTO_WIDTH + left + right
    const cardHeight = PHOTO_HEIGHT + top + bottom
    const photoX = padding + left
    const photoY = padding + top
    const cardRight = padding + cardWidth
    const middle = photoY + PHOTO_HEIGHT + bottom / 2
    const bars: Bar[] = []

    if (spec.layout === 'split') {
      bars.push(
        { x: padding + 2, y: middle - 1.4, width: 9, height: 1.2, strong: true },
        { x: padding + 2, y: middle + 0.6, width: 6, height: 0.8 },
        { x: cardRight - 15, y: middle - 1.5, width: 3, height: 3, strong: true },
        { x: cardRight - 10.5, y: middle - 1.4, width: 8.5, height: 1.2 },
        { x: cardRight - 10.5, y: middle + 0.6, width: 5.5, height: 0.8 }
      )
    } else if (spec.layout === 'bar') {
      bars.push(
        { x: padding + 2, y: middle - 1.1, width: 8, height: 2.2, strong: true },
        { x: cardRight - 11, y: middle - 1.45, width: 9, height: 1, strong: true },
        { x: cardRight - 8.5, y: middle - 0.1, width: 6.5, height: 0.6 },
        { x: cardRight - 9.5, y: middle + 0.85, width: 7.5, height: 0.6 }
      )
    } else if (spec.layout === 'column') {
      // A rule beside the photo, then logo and caption groups bottom-aligned with the photo.
      const ruleX = photoX + PHOTO_WIDTH + left
      const textX = ruleX + 0.4 + left
      const bottomY = photoY + PHOTO_HEIGHT
      bars.push(
        { x: ruleX, y: photoY, width: 0.4, height: PHOTO_HEIGHT },
        { x: textX, y: bottomY - 10.4, width: 7, height: 1.8, strong: true },
        { x: textX, y: bottomY - 6.6, width: 9, height: 1, strong: true },
        { x: textX, y: bottomY - 5.1, width: 11, height: 0.7 },
        { x: textX, y: bottomY - 2.6, width: 10, height: 1, strong: true },
        { x: textX, y: bottomY - 0.9, width: 6, height: 0.7 }
      )
    } else {
      const side = spec.placement !== 'bottom'
      const rows = stackRows(spec, side ? SIDE_ROW_SCALE : 1)
      const total = rows.reduce((sum, row) => sum + row.gap + row.height, 0)
      // Side captions align toward the photo, like the renderer.
      const rowX = (width: number) =>
        spec.placement === 'right'
          ? photoX + PHOTO_WIDTH + left
          : spec.placement === 'left'
            ? photoX - right - width
            : padding + (cardWidth - width) / 2
      let y = side ? photoY + (PHOTO_HEIGHT - total) / 2 : middle - total / 2
      for (const row of rows) {
        y += row.gap
        bars.push({
          x: rowX(row.width),
          y,
          width: row.width,
          height: row.height,
          strong: row.strong
        })
        y += row.height
      }
    }

    return {
      id,
      label: t(`frame.template.${id}`),
      viewBox: `0 0 ${cardWidth + padding * 2} ${cardHeight + padding * 2}`,
      backdrop: spec.backdrop,
      card: { x: padding, y: padding, width: cardWidth, height: cardHeight },
      photo: { x: photoX, y: photoY },
      bars
    }
  })
)
</script>

<template>
  <div class="border-b border-border p-5">
    <p class="text-xs font-medium">{{ t('frame.template.heading') }}</p>
    <div class="mt-4 grid grid-cols-4 gap-2" role="group" :aria-label="t('frame.template.heading')">
      <button
        v-for="item in schematics"
        :key="item.id"
        type="button"
        class="flex flex-col items-center gap-1.5 rounded-lg border px-1.5 py-2 text-[10px] transition"
        :class="
          model === item.id
            ? 'border-primary bg-accent text-accent-foreground'
            : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-accent/60'
        "
        :aria-pressed="model === item.id"
        @click="model = item.id"
      >
        <svg class="h-14 w-full" :viewBox="item.viewBox" aria-hidden="true">
          <rect v-if="item.backdrop" width="100%" height="100%" fill="currentColor" opacity="0.1" />
          <rect
            :x="item.card.x"
            :y="item.card.y"
            :width="item.card.width"
            :height="item.card.height"
            class="fill-card stroke-border"
            stroke-width="0.4"
          />
          <rect
            :x="item.photo.x"
            :y="item.photo.y"
            width="36"
            height="24"
            fill="currentColor"
            opacity="0.35"
          />
          <rect
            v-for="(bar, index) in item.bars"
            :key="index"
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            fill="currentColor"
            :opacity="bar.strong ? 0.85 : 0.45"
          />
        </svg>
        {{ item.label }}
      </button>
    </div>
    <p class="mt-3 text-[10px] leading-relaxed text-muted-foreground">
      {{ t('frame.template.hint') }}
    </p>
  </div>
</template>
