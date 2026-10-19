<script setup lang="ts">
import { MAX_COMPOSITION_GAP, MAX_COMPOSITION_PADDING } from '~/types/composition'
import type { CompositionSettings } from '~/types/composition'

const settings = defineModel<CompositionSettings>({ required: true })
const { t } = useI18n()
const advancedPadding = ref(false)

const clampSpacing = (value: number | string, maximum: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(0, Math.round(parsed))) : 0
}

const paddingModel = computed({
  get: () => settings.value.padding.top,
  set: (value: number) => {
    settings.value.padding = { top: value, right: value, bottom: value, left: value }
  }
})
const fitOptions = computed(() => [
  { value: 'cover' as const, label: t('composition.spacing.cover') },
  { value: 'contain' as const, label: t('composition.spacing.contain') }
])
const paddingControls = computed(() => [
  {
    key: 'top' as const,
    label: t('composition.spacing.top'),
    name: t('composition.spacing.topPadding')
  },
  {
    key: 'right' as const,
    label: t('composition.spacing.right'),
    name: t('composition.spacing.rightPadding')
  },
  {
    key: 'bottom' as const,
    label: t('composition.spacing.bottom'),
    name: t('composition.spacing.bottomPadding')
  },
  {
    key: 'left' as const,
    label: t('composition.spacing.left'),
    name: t('composition.spacing.leftPadding')
  }
])
const updatePadding = (key: 'top' | 'right' | 'bottom' | 'left', event: Event) => {
  settings.value.padding[key] = clampSpacing(
    (event.target as HTMLInputElement).value,
    MAX_COMPOSITION_PADDING
  )
}
const isMixedPadding = computed(() => {
  const { top, right, bottom, left } = settings.value.padding
  return top !== right || top !== bottom || top !== left
})
</script>

<template>
  <div class="space-y-5 border-b border-border p-5">
    <div>
      <div class="flex items-center justify-between gap-3 text-xs">
        <span class="font-medium">{{ t('composition.spacing.padding') }}</span>
        <FilmToggleField
          v-model="advancedPadding"
          :label="t('composition.spacing.individual')"
          :aria-label="t('composition.spacing.individualLabel')"
        />
      </div>

      <FilmRangeField
        v-if="!advancedPadding && !isMixedPadding"
        v-model="paddingModel"
        class="mt-4"
        :label="t('composition.spacing.uniform')"
        :input-label="t('composition.spacing.uniformInput')"
        :min="0"
        :max="MAX_COMPOSITION_PADDING"
        unit="px"
        :factor="1"
      />

      <div
        v-else-if="!advancedPadding"
        class="mt-4 flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2.5"
      >
        <p class="font-mono text-[9px] leading-relaxed text-muted-foreground">
          {{
            t('composition.spacing.summary', {
              top: settings.padding.top,
              right: settings.padding.right,
              bottom: settings.padding.bottom,
              left: settings.padding.left
            })
          }}
        </p>
        <button
          type="button"
          class="shrink-0 text-[10px] font-medium text-foreground/80 hover:text-foreground"
          @click="advancedPadding = true"
        >
          {{ t('composition.spacing.expand') }}
        </button>
      </div>

      <div v-else class="mt-4 grid grid-cols-2 gap-2">
        <label
          v-for="control in paddingControls"
          :key="control.key"
          class="flex items-center gap-2 rounded-md border border-border bg-card px-2.5"
        >
          <span class="w-4 text-[10px] text-muted-foreground">{{ control.label }}</span>
          <input
            :value="settings.padding[control.key]"
            class="min-w-0 flex-1 bg-transparent py-2 text-right font-mono text-[10px] outline-none"
            type="number"
            min="0"
            :max="MAX_COMPOSITION_PADDING"
            step="1"
            :aria-label="control.name"
            @input="updatePadding(control.key, $event)"
          />
          <span class="font-mono text-[9px] text-muted-foreground/70">px</span>
        </label>
      </div>
    </div>

    <FilmRangeField
      v-if="settings.frameCount > 1"
      v-model="settings.gap"
      :label="t('composition.spacing.gap')"
      :input-label="t('composition.spacing.gapInput')"
      :min="0"
      :max="MAX_COMPOSITION_GAP"
      unit="px"
      :factor="1"
    />

    <FilmSegmented v-model="settings.fit" :options="fitOptions" />
  </div>
</template>
