<script setup lang="ts">
import type { CompositionSettings } from '~/types/composition'

const settings = defineModel<CompositionSettings>({ required: true })
const { t } = useI18n()

const ratios = [
  { label: '4:5', value: 4 / 5 },
  { label: '1:1', value: 1 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 }
]

const selectPresetRatio = (value: number) => {
  settings.value.ratioMode = 'preset'
  settings.value.ratio = value
}
</script>

<template>
  <div class="border-b border-border p-5">
    <p class="eyebrow">{{ t('composition.ratio.heading') }}</p>
    <div class="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
      <button
        v-for="option in ratios"
        :key="option.label"
        class="rounded-md py-2 font-mono text-[10px] transition"
        :class="
          settings.ratioMode === 'preset' && settings.ratio === option.value
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        "
        @click="selectPresetRatio(option.value)"
      >
        {{ option.label }}
      </button>
      <button
        class="rounded-md py-2 text-[10px] transition"
        :class="
          settings.ratioMode === 'auto'
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        "
        @click="settings.ratioMode = 'auto'"
      >
        {{ t('composition.ratio.auto') }}
      </button>
      <button
        class="rounded-md py-2 text-[10px] transition"
        :class="
          settings.ratioMode === 'custom'
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        "
        @click="settings.ratioMode = 'custom'"
      >
        {{ t('composition.ratio.custom') }}
      </button>
    </div>

    <div v-if="settings.ratioMode === 'custom'" class="mt-3 flex items-center gap-2">
      <label class="min-w-0 flex-1">
        <span class="sr-only">{{ t('composition.ratio.customWidth') }}</span>
        <input
          v-model.number="settings.customRatioWidth"
          class="w-full rounded-md border border-border bg-card px-3 py-2 text-center font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          type="number"
          min="1"
          max="99"
          step="1"
          :aria-label="t('composition.ratio.customWidth')"
        />
      </label>
      <span class="font-mono text-xs text-muted-foreground/70">:</span>
      <label class="min-w-0 flex-1">
        <span class="sr-only">{{ t('composition.ratio.customHeight') }}</span>
        <input
          v-model.number="settings.customRatioHeight"
          class="w-full rounded-md border border-border bg-card px-3 py-2 text-center font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          type="number"
          min="1"
          max="99"
          step="1"
          :aria-label="t('composition.ratio.customHeight')"
        />
      </label>
    </div>
    <p
      v-else-if="settings.ratioMode === 'auto'"
      class="mt-3 text-[10px] leading-relaxed text-muted-foreground"
    >
      {{ t('composition.ratio.autoHint') }}
    </p>
  </div>
</template>
