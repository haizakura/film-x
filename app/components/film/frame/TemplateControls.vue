<script setup lang="ts">
import { FRAME_TEMPLATES } from '~/types/frame'
import type { FrameTemplate } from '~/types/frame'

const model = defineModel<FrameTemplate>({ required: true })
const { t } = useI18n()

const TEMPLATES: FrameTemplate[] = ['polaroid', 'gallery', 'float', 'strip']
// Schematic of a 3:2 photo using the same relative border math as the renderer.
const PHOTO_WIDTH = 36
const PHOTO_HEIGHT = 24
const UNIT = Math.sqrt(PHOTO_WIDTH * PHOTO_HEIGHT)
const BACKDROP_PADDING = 0.12

interface Bar {
  x: number
  y: number
  width: number
  height: number
  strong?: boolean
}

const schematics = computed(() =>
  TEMPLATES.map((id) => {
    const spec = FRAME_TEMPLATES[id]
    const padding = spec.backdrop ? BACKDROP_PADDING * UNIT : 0
    const side = spec.border.side * UNIT
    const top = spec.border.top * UNIT
    const bottom = spec.border.bottom * UNIT
    const cardWidth = PHOTO_WIDTH + side * 2
    const cardHeight = PHOTO_HEIGHT + top + bottom
    const areaY = padding + top + PHOTO_HEIGHT
    const centerX = padding + cardWidth / 2
    const bars: Bar[] = []

    if (spec.layout === 'split') {
      const middle = areaY + bottom / 2
      bars.push(
        { x: padding + 2, y: middle - 1.4, width: 9, height: 1.2, strong: true },
        { x: padding + 2, y: middle + 0.6, width: 6, height: 0.8 },
        { x: padding + cardWidth - 15, y: middle - 1.5, width: 3, height: 3, strong: true },
        { x: padding + cardWidth - 10.5, y: middle - 1.4, width: 8.5, height: 1.2 },
        { x: padding + cardWidth - 10.5, y: middle + 0.6, width: 5.5, height: 0.8 }
      )
    } else {
      const rows: Array<{ width: number; height: number; gap: number; strong?: boolean }> = [
        { width: 14, height: 1.6, gap: 0, strong: true }
      ]
      if (spec.showTagline) rows.push({ width: 9, height: 0.7, gap: 0.8 })
      if (spec.showInfo) {
        rows.push(
          { width: 10, height: 0.7, gap: 1.6 },
          { width: 12, height: 0.7, gap: 0.7 },
          { width: 8, height: 0.7, gap: 0.7 }
        )
      }
      const total = rows.reduce((sum, row) => sum + row.gap + row.height, 0)
      let y = areaY + (bottom - total) / 2
      for (const row of rows) {
        y += row.gap
        bars.push({
          x: centerX - row.width / 2,
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
      photo: { x: padding + side, y: padding + top },
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
