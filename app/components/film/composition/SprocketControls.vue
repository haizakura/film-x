<script setup lang="ts">
import {
  COMPOSITION_SPROCKET_TEXT_COLORS,
  MAX_COMPOSITION_SPROCKET_TEXT_LENGTH,
  MAX_COMPOSITION_SPROCKET_WIDTH,
  MIN_COMPOSITION_SPROCKET_WIDTH
} from '~/types/composition'
import type { CompositionSettings, CompositionSprocketTextColorPreset } from '~/types/composition'

const settings = defineModel<CompositionSettings>({ required: true })
const { t } = useI18n()

const placementOptions = computed(() => [
  { value: 'top-bottom' as const, label: t('composition.sprocket.topBottom') },
  { value: 'left-right' as const, label: t('composition.sprocket.leftRight') }
])
const colorOptions = computed(() => [
  { value: 'background' as const, label: t('composition.sprocket.background') },
  { value: 'black' as const, label: t('composition.sprocket.black') }
])

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
      <FilmToggleField
        v-model="settings.sprocket.enabled"
        :label="t('composition.sprocket.enabled')"
        :aria-label="t('composition.sprocket.enabledLabel')"
      />
    </div>

    <div v-if="settings.sprocket.enabled" class="mt-4 space-y-4">
      <div>
        <p class="mb-2 text-[10px] text-muted-foreground">
          {{ t('composition.sprocket.placement') }}
        </p>
        <FilmSegmented
          v-model="settings.sprocket.placement"
          :options="placementOptions"
          :label="t('composition.sprocket.placement')"
        />
      </div>

      <FilmRangeField
        v-model="settings.sprocket.width"
        :label="t('composition.sprocket.width')"
        :input-label="t('composition.sprocket.widthInput')"
        :min="MIN_COMPOSITION_SPROCKET_WIDTH"
        :max="MAX_COMPOSITION_SPROCKET_WIDTH"
        unit="px"
        :factor="1"
      />

      <div>
        <p class="mb-2 text-[10px] text-muted-foreground">
          {{ t('composition.sprocket.color') }}
        </p>
        <FilmSegmented
          v-model="settings.sprocket.color"
          :options="colorOptions"
          :label="t('composition.sprocket.color')"
        />
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
        <FilmColorField
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
