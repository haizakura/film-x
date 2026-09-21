<script setup lang="ts">
import { Check } from '@lucide/vue'
import { Switch } from '@/components/ui/switch'
import { MAX_COMPOSITION_SPROCKET_WIDTH, MIN_COMPOSITION_SPROCKET_WIDTH } from '~/types/composition'
import type { CompositionSettings } from '~/types/composition'

const settings = defineModel<CompositionSettings>({ required: true })
const { t } = useI18n()

const sprocketWidth = computed({
  get: () => settings.value.sprocket.width,
  set: (value: number | string) => {
    const parsed = Number(value)
    settings.value.sprocket.width = Number.isFinite(parsed)
      ? Math.min(
          MAX_COMPOSITION_SPROCKET_WIDTH,
          Math.max(MIN_COMPOSITION_SPROCKET_WIDTH, Math.round(parsed))
        )
      : MIN_COMPOSITION_SPROCKET_WIDTH
  }
})
</script>

<template>
  <div class="border-b border-border p-5">
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs font-medium">{{ t('composition.sprocket.heading') }}</p>
      <label class="flex items-center gap-2 text-[10px] text-muted-foreground">
        {{ t('composition.sprocket.enabled') }}
        <Switch
          v-model="settings.sprocket.enabled"
          size="sm"
          :aria-label="t('composition.sprocket.enabledLabel')"
        >
          <template #thumb="{ checked }">
            <Check v-if="checked" class="size-2 stroke-3" aria-hidden="true" />
          </template>
        </Switch>
      </label>
    </div>

    <div v-if="settings.sprocket.enabled" class="mt-4 space-y-4">
      <div>
        <p class="mb-2 text-[10px] text-muted-foreground">
          {{ t('composition.sprocket.placement') }}
        </p>
        <div class="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          <button
            class="rounded-md py-2 text-[11px] transition"
            :class="
              settings.sprocket.placement === 'top-bottom'
                ? 'bg-primary font-medium text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            "
            @click="settings.sprocket.placement = 'top-bottom'"
          >
            {{ t('composition.sprocket.topBottom') }}
          </button>
          <button
            class="rounded-md py-2 text-[11px] transition"
            :class="
              settings.sprocket.placement === 'left-right'
                ? 'bg-primary font-medium text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            "
            @click="settings.sprocket.placement = 'left-right'"
          >
            {{ t('composition.sprocket.leftRight') }}
          </button>
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
          <span>{{ t('composition.sprocket.width') }}</span>
          <label class="flex items-center gap-1 rounded-md border border-border bg-card px-2">
            <span class="sr-only">{{ t('composition.sprocket.widthInput') }}</span>
            <input
              v-model.number="sprocketWidth"
              class="w-12 bg-transparent py-1.5 text-right font-mono text-[10px] outline-none"
              type="number"
              :min="MIN_COMPOSITION_SPROCKET_WIDTH"
              :max="MAX_COMPOSITION_SPROCKET_WIDTH"
              step="1"
              inputmode="numeric"
              :aria-label="t('composition.sprocket.widthInput')"
            />
            <span class="font-mono text-[9px] text-muted-foreground/70">px</span>
          </label>
        </div>
        <input
          v-model.number="sprocketWidth"
          class="range w-full"
          type="range"
          :min="MIN_COMPOSITION_SPROCKET_WIDTH"
          :max="MAX_COMPOSITION_SPROCKET_WIDTH"
          step="4"
          :aria-label="t('composition.sprocket.width')"
        />
      </div>

      <div>
        <p class="mb-2 text-[10px] text-muted-foreground">
          {{ t('composition.sprocket.color') }}
        </p>
        <div class="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          <button
            class="rounded-md py-2 text-[11px] transition"
            :class="
              settings.sprocket.color === 'background'
                ? 'bg-primary font-medium text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            "
            @click="settings.sprocket.color = 'background'"
          >
            {{ t('composition.sprocket.background') }}
          </button>
          <button
            class="rounded-md py-2 text-[11px] transition"
            :class="
              settings.sprocket.color === 'black'
                ? 'bg-primary font-medium text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            "
            @click="settings.sprocket.color = 'black'"
          >
            {{ t('composition.sprocket.black') }}
          </button>
        </div>
      </div>

      <p class="text-[10px] leading-relaxed text-muted-foreground">
        {{ t('composition.sprocket.sizeHint') }}
      </p>
    </div>
  </div>
</template>
