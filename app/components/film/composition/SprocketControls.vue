<script setup lang="ts">
import { Check } from '@lucide/vue'
import { Switch } from '@/components/ui/switch'
import {
  clampCompositionSprocketWidth,
  COMPOSITION_SPROCKET_TEXT_COLORS,
  MAX_COMPOSITION_SPROCKET_TEXT_LENGTH,
  MAX_COMPOSITION_SPROCKET_WIDTH,
  MIN_COMPOSITION_SPROCKET_WIDTH
} from '~/types/composition'
import type { CompositionSettings, CompositionSprocketTextColorPreset } from '~/types/composition'

const settings = defineModel<CompositionSettings>({ required: true })
const { t } = useI18n()

const sprocketWidth = computed({
  get: () => settings.value.sprocket.width,
  set: (value: number | string) => {
    const parsed = Number(value)
    settings.value.sprocket.width = Number.isFinite(parsed)
      ? clampCompositionSprocketWidth(parsed)
      : MIN_COMPOSITION_SPROCKET_WIDTH
  }
})

const textColorPresets = computed<
  Array<{ value: CompositionSprocketTextColorPreset; label: string; color: string }>
>(() => [
  {
    value: 'amber',
    label: t('composition.sprocket.textColorAmber'),
    color: COMPOSITION_SPROCKET_TEXT_COLORS.amber
  },
  {
    value: 'white',
    label: t('composition.sprocket.textColorWhite'),
    color: COMPOSITION_SPROCKET_TEXT_COLORS.white
  },
  {
    value: 'black',
    label: t('composition.sprocket.textColorBlack'),
    color: COMPOSITION_SPROCKET_TEXT_COLORS.black
  }
])
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

      <div>
        <p class="mb-2 text-[10px] text-muted-foreground">
          {{ t('composition.sprocket.text') }}
        </p>
        <input
          v-model="settings.sprocket.text"
          class="w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-xs outline-none transition placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          type="text"
          :maxlength="MAX_COMPOSITION_SPROCKET_TEXT_LENGTH"
          autocomplete="off"
          spellcheck="false"
          :aria-label="t('composition.sprocket.textInput')"
          :placeholder="t('composition.sprocket.textPlaceholder')"
        />
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between gap-3">
          <p class="text-[10px] text-muted-foreground">
            {{ t('composition.sprocket.textColor') }}
          </p>
          <div
            class="flex items-center gap-1.5"
            role="group"
            :aria-label="t('composition.sprocket.textColorPresets')"
          >
            <button
              v-for="preset in textColorPresets"
              :key="preset.value"
              type="button"
              class="size-5 rounded-full border border-border shadow-xs transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              :class="
                settings.sprocket.textColor.toUpperCase() === preset.color
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                  : 'hover:scale-110'
              "
              :style="{ backgroundColor: preset.color }"
              :title="preset.label"
              :aria-label="preset.label"
              :aria-pressed="settings.sprocket.textColor.toUpperCase() === preset.color"
              @click="settings.sprocket.textColor = preset.color"
            />
          </div>
        </div>
        <FilmCompositionColorField
          v-model="settings.sprocket.textColor"
          :picker-label="t('composition.sprocket.textColorPicker')"
          :hex-label="t('composition.sprocket.textColorHex')"
          :placeholder="COMPOSITION_SPROCKET_TEXT_COLORS.amber"
        />
      </div>

      <p class="text-[10px] leading-relaxed text-muted-foreground">
        {{ t('composition.sprocket.textHint') }}
      </p>

      <p class="text-[10px] leading-relaxed text-muted-foreground">
        {{ t('composition.sprocket.sizeHint') }}
      </p>
    </div>
  </div>
</template>
