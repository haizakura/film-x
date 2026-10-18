<script setup lang="ts">
import {
  FRAME_TEMPLATES,
  MAX_FRAME_BORDER,
  MAX_FRAME_CAPTION_COLUMN,
  MAX_FRAME_COLUMN_GAP
} from '~/types/frame'
import type { FrameBorder, FrameColumnSpacing, FrameSettings } from '~/types/frame'

const settings = defineModel<FrameSettings>({ required: true })
const { t } = useI18n()

// Paper presets carry a matching ink colour so captions stay legible.
const PAPER_PRESETS = [
  { id: 'white', frame: '#FFFFFF', text: '#1C1C1C' },
  { id: 'paper', frame: '#F4EFE6', text: '#2B2620' },
  { id: 'mist', frame: '#E7E7E4', text: '#1C1C1C' },
  { id: 'charcoal', frame: '#232323', text: '#EDEDED' },
  { id: 'black', frame: '#0B0B0B', text: '#F2F2F2' }
] as const

interface BorderSlider {
  id: 'top' | 'side' | 'bottom' | 'left' | 'right' | 'panel'
  /** Edges written together; the first one is displayed. */
  edges: [keyof FrameBorder, ...Array<keyof FrameBorder>]
}

// Bottom captions keep matched side borders; side captions expose each edge and the column.
const borderSliders = computed<BorderSlider[]>(() => {
  const { placement } = FRAME_TEMPLATES[settings.value.template]
  if (placement === 'bottom') {
    return [
      { id: 'top', edges: ['top'] },
      { id: 'side', edges: ['left', 'right'] },
      { id: 'bottom', edges: ['bottom'] }
    ]
  }
  const outer = placement === 'right' ? 'left' : 'right'
  return [
    { id: 'top', edges: ['top'] },
    { id: 'bottom', edges: ['bottom'] },
    { id: outer, edges: [outer] },
    { id: 'panel', edges: [placement] }
  ]
})

const COLUMN_GAPS: Array<keyof FrameColumnSpacing> = ['photo', 'text', 'logo', 'group']
const columnLayout = computed(() => FRAME_TEMPLATES[settings.value.template].layout === 'column')

const setBorder = (slider: BorderSlider, value: number) => {
  for (const edge of slider.edges) settings.value.border[edge] = value
}

const applyPaper = (preset: (typeof PAPER_PRESETS)[number]) => {
  settings.value.frameColor = preset.frame
  settings.value.textColor = preset.text
}
const isPaper = (preset: (typeof PAPER_PRESETS)[number]) =>
  settings.value.frameColor.toUpperCase() === preset.frame &&
  settings.value.textColor.toUpperCase() === preset.text
</script>

<template>
  <div class="space-y-5 border-b border-border p-5">
    <p class="text-xs font-medium">{{ t('frame.style.heading') }}</p>

    <div class="space-y-2">
      <div class="flex items-center justify-between gap-3">
        <p class="text-[10px] text-muted-foreground">{{ t('frame.style.frameColor') }}</p>
        <div
          class="flex items-center gap-1.5"
          role="group"
          :aria-label="t('frame.style.presets.heading')"
        >
          <button
            v-for="preset in PAPER_PRESETS"
            :key="preset.id"
            type="button"
            class="size-5 rounded-full border border-border shadow-xs transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            :class="
              isPaper(preset)
                ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                : 'hover:scale-110'
            "
            :style="{ backgroundColor: preset.frame }"
            :title="t(`frame.style.presets.${preset.id}`)"
            :aria-label="t(`frame.style.presets.${preset.id}`)"
            :aria-pressed="isPaper(preset)"
            @click="applyPaper(preset)"
          />
        </div>
      </div>
      <FilmColorField
        v-model="settings.frameColor"
        :picker-label="t('frame.style.frameColorPicker')"
        :hex-label="t('frame.style.frameColorHex')"
        placeholder="#FFFFFF"
      />
    </div>

    <div class="space-y-2">
      <p class="text-[10px] text-muted-foreground">{{ t('frame.style.textColor') }}</p>
      <FilmColorField
        v-model="settings.textColor"
        :picker-label="t('frame.style.textColorPicker')"
        :hex-label="t('frame.style.textColorHex')"
        placeholder="#1C1C1C"
      />
    </div>

    <div class="space-y-4">
      <FilmFrameRangeField
        v-for="slider in borderSliders"
        :key="slider.id"
        :model-value="settings.border[slider.edges[0]]"
        :label="t(`frame.style.border.${slider.id}`)"
        :input-label="t(`frame.style.border.${slider.id}Input`)"
        :min="0"
        :max="(slider.id === 'panel' ? MAX_FRAME_CAPTION_COLUMN : MAX_FRAME_BORDER) * 100"
        :step="0.5"
        @update:model-value="setBorder(slider, $event)"
      />
      <p class="text-[10px] leading-relaxed text-muted-foreground">
        {{ t('frame.style.borderHint') }}
      </p>
    </div>

    <div v-if="columnLayout" class="space-y-4 border-t border-border pt-4">
      <p class="text-[10px] text-muted-foreground">{{ t('frame.style.spacing.heading') }}</p>
      <FilmFrameRangeField
        v-for="gap in COLUMN_GAPS"
        :key="gap"
        v-model="settings.columnSpacing[gap]"
        :label="t(`frame.style.spacing.${gap}`)"
        :input-label="t(`frame.style.spacing.${gap}Input`)"
        :min="0"
        :max="MAX_FRAME_COLUMN_GAP * 100"
        :step="0.5"
      />
    </div>
  </div>
</template>
