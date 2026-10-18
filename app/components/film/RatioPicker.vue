<script setup lang="ts">
import { CANVAS_RATIO_PRESETS } from '~/types/canvas'
import type { CanvasRatioMode } from '~/types/canvas'

const mode = defineModel<CanvasRatioMode>('mode', { required: true })
const ratio = defineModel<number>('ratio', { required: true })
const customWidth = defineModel<number>('customWidth', { required: true })
const customHeight = defineModel<number>('customHeight', { required: true })
const { t } = useI18n()

const selectPreset = (value: number) => {
  mode.value = 'preset'
  ratio.value = value
}
</script>

<template>
  <div>
    <div class="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
      <button
        v-for="option in CANVAS_RATIO_PRESETS"
        :key="option.label"
        type="button"
        class="rounded-md py-2 font-mono text-[10px] transition"
        :class="
          mode === 'preset' && ratio === option.value
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        "
        @click="selectPreset(option.value)"
      >
        {{ option.label }}
      </button>
      <button
        type="button"
        class="rounded-md py-2 text-[10px] transition"
        :class="
          mode === 'auto'
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        "
        @click="mode = 'auto'"
      >
        {{ t('ratio.auto') }}
      </button>
      <button
        type="button"
        class="rounded-md py-2 text-[10px] transition"
        :class="
          mode === 'custom'
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        "
        @click="mode = 'custom'"
      >
        {{ t('ratio.custom') }}
      </button>
    </div>

    <div v-if="mode === 'custom'" class="mt-3 flex items-center gap-2">
      <label class="min-w-0 flex-1">
        <span class="sr-only">{{ t('ratio.customWidth') }}</span>
        <input
          v-model.number="customWidth"
          class="w-full rounded-md border border-border bg-card px-3 py-2 text-center font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          type="number"
          min="1"
          max="99"
          step="1"
          :aria-label="t('ratio.customWidth')"
        />
      </label>
      <span class="font-mono text-xs text-muted-foreground/70">:</span>
      <label class="min-w-0 flex-1">
        <span class="sr-only">{{ t('ratio.customHeight') }}</span>
        <input
          v-model.number="customHeight"
          class="w-full rounded-md border border-border bg-card px-3 py-2 text-center font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          type="number"
          min="1"
          max="99"
          step="1"
          :aria-label="t('ratio.customHeight')"
        />
      </label>
    </div>
  </div>
</template>
