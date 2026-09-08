<script setup lang="ts">
import { Check } from '@lucide/vue'
import { Switch } from '@/components/ui/switch'
import type { CompositionSettings } from '~/types/composition'

const MAX_PADDING = 220
const MAX_GAP = 160
const settings = defineModel<CompositionSettings>({ required: true })
const { t } = useI18n()
const advancedPadding = ref(false)

const clampSpacing = (value: number | string, maximum: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(0, Math.round(parsed))) : 0
}

const spacingModel = (getValue: () => number, setValue: (value: number) => void, maximum: number) =>
  computed({
    get: getValue,
    set: (value: number | string) => setValue(clampSpacing(value, maximum))
  })

const paddingModel = computed({
  get: () => settings.value.padding.top,
  set: (value: number | string) => {
    const next = clampSpacing(value, MAX_PADDING)
    settings.value.padding = { top: next, right: next, bottom: next, left: next }
  }
})
const gapModel = spacingModel(
  () => settings.value.gap,
  (value) => (settings.value.gap = value),
  MAX_GAP
)
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
  settings.value.padding[key] = clampSpacing((event.target as HTMLInputElement).value, MAX_PADDING)
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
        <label class="flex items-center gap-2 text-[10px] text-muted-foreground">
          {{ t('composition.spacing.individual') }}
          <Switch
            v-model="advancedPadding"
            size="sm"
            :aria-label="t('composition.spacing.individualLabel')"
          >
            <template #thumb="{ checked }">
              <Check v-if="checked" class="size-2 stroke-3" aria-hidden="true" />
            </template>
          </Switch>
        </label>
      </div>

      <div v-if="!advancedPadding && !isMixedPadding" class="mt-4 flex items-center gap-3">
        <input
          v-model.number="paddingModel"
          class="range min-w-0 flex-1"
          type="range"
          min="0"
          :max="MAX_PADDING"
          step="4"
          :aria-label="t('composition.spacing.uniform')"
        />
        <label
          class="flex shrink-0 items-center gap-1 rounded-md border border-border bg-card px-2"
        >
          <span class="sr-only">{{ t('composition.spacing.uniformInput') }}</span>
          <input
            v-model.number="paddingModel"
            class="w-12 bg-transparent py-1.5 text-right font-mono text-[10px] outline-none"
            type="number"
            min="0"
            :max="MAX_PADDING"
            step="1"
            :aria-label="t('composition.spacing.uniformInput')"
          />
          <span class="font-mono text-[9px] text-muted-foreground/70">px</span>
        </label>
      </div>

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
            :max="MAX_PADDING"
            step="1"
            :aria-label="control.name"
            @input="updatePadding(control.key, $event)"
          />
          <span class="font-mono text-[9px] text-muted-foreground/70">px</span>
        </label>
      </div>
    </div>

    <div>
      <div class="mb-3 flex items-center justify-between text-xs">
        <span class="font-medium">{{ t('composition.spacing.gap') }}</span>
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model.number="gapModel"
          class="range min-w-0 flex-1"
          type="range"
          min="0"
          :max="MAX_GAP"
          step="4"
          :aria-label="t('composition.spacing.gap')"
        />
        <label
          class="flex shrink-0 items-center gap-1 rounded-md border border-border bg-card px-2"
        >
          <span class="sr-only">{{ t('composition.spacing.gapInput') }}</span>
          <input
            v-model.number="gapModel"
            class="w-12 bg-transparent py-1.5 text-right font-mono text-[10px] outline-none"
            type="number"
            min="0"
            :max="MAX_GAP"
            step="1"
            :aria-label="t('composition.spacing.gapInput')"
          />
          <span class="font-mono text-[9px] text-muted-foreground/70">px</span>
        </label>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
      <button
        class="rounded-md py-2 text-[11px]"
        :class="
          settings.fit === 'cover'
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        "
        @click="settings.fit = 'cover'"
      >
        {{ t('composition.spacing.cover') }}
      </button>
      <button
        class="rounded-md py-2 text-[11px]"
        :class="
          settings.fit === 'contain'
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        "
        @click="settings.fit = 'contain'"
      >
        {{ t('composition.spacing.contain') }}
      </button>
    </div>
  </div>
</template>
