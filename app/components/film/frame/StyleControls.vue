<script setup lang="ts">
import { MAX_FRAME_BORDER } from '~/types/frame'
import type { FrameBorder, FrameSettings } from '~/types/frame'

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

const BORDERS: Array<keyof FrameBorder> = ['top', 'side', 'bottom']

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
        v-for="edge in BORDERS"
        :key="edge"
        v-model="settings.border[edge]"
        :label="t(`frame.style.border.${edge}`)"
        :input-label="t(`frame.style.border.${edge}Input`)"
        :min="0"
        :max="MAX_FRAME_BORDER * 100"
        :step="0.5"
      />
      <p class="text-[10px] leading-relaxed text-muted-foreground">
        {{ t('frame.style.borderHint') }}
      </p>
    </div>
  </div>
</template>
