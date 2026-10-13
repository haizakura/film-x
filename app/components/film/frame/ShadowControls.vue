<script setup lang="ts">
import { MAX_FRAME_BACKDROP_PADDING, MAX_FRAME_SHADOW_INTENSITY } from '~/types/frame'
import type { FrameSettings } from '~/types/frame'

const settings = defineModel<FrameSettings>({ required: true })
const { t } = useI18n()

const BACKDROP_PRESETS = ['#ECEAE6', '#FFFFFF', '#D9D4CA', '#3A3A38', '#121212'] as const
</script>

<template>
  <div class="space-y-5 border-b border-border p-5">
    <p class="text-xs font-medium">{{ t('frame.shadow.heading') }}</p>

    <div class="space-y-3">
      <p class="text-[10px] text-muted-foreground">{{ t('frame.shadow.photo') }}</p>
      <FilmFrameShadowPresets
        v-model="settings.photoShadow.preset"
        :label="t('frame.shadow.photo')"
        :surface="settings.frameColor"
      />
      <FilmFrameRangeField
        v-if="settings.photoShadow.preset !== 'none'"
        v-model="settings.photoShadow.intensity"
        :label="t('frame.shadow.intensity')"
        :input-label="t('frame.shadow.photoIntensityInput')"
        :min="0"
        :max="MAX_FRAME_SHADOW_INTENSITY * 100"
        :step="5"
      />
    </div>

    <div class="space-y-3 border-t border-border pt-4">
      <FilmFrameToggleField
        v-model="settings.backdrop.enabled"
        :label="t('frame.shadow.backdrop')"
        :aria-label="t('frame.shadow.backdropLabel')"
      />
      <template v-if="settings.backdrop.enabled">
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-3">
            <p class="text-[10px] text-muted-foreground">{{ t('frame.shadow.backdropColor') }}</p>
            <div
              class="flex items-center gap-1.5"
              role="group"
              :aria-label="t('frame.shadow.backdropPresets')"
            >
              <button
                v-for="color in BACKDROP_PRESETS"
                :key="color"
                type="button"
                class="size-5 rounded-full border border-border shadow-xs transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                :class="
                  settings.backdrop.color.toUpperCase() === color
                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                    : 'hover:scale-110'
                "
                :style="{ backgroundColor: color }"
                :title="color"
                :aria-label="t('frame.shadow.backdropPreset', { color })"
                :aria-pressed="settings.backdrop.color.toUpperCase() === color"
                @click="settings.backdrop.color = color"
              />
            </div>
          </div>
          <FilmColorField
            v-model="settings.backdrop.color"
            :picker-label="t('frame.shadow.backdropColorPicker')"
            :hex-label="t('frame.shadow.backdropColorHex')"
            placeholder="#ECEAE6"
          />
        </div>
        <FilmFrameRangeField
          v-model="settings.backdrop.padding"
          :label="t('frame.shadow.padding')"
          :input-label="t('frame.shadow.paddingInput')"
          :min="0"
          :max="MAX_FRAME_BACKDROP_PADDING * 100"
          :step="0.5"
        />
        <p class="text-[10px] text-muted-foreground">{{ t('frame.shadow.card') }}</p>
        <FilmFrameShadowPresets
          v-model="settings.backdrop.shadow.preset"
          :label="t('frame.shadow.card')"
          :surface="settings.backdrop.color"
        />
        <FilmFrameRangeField
          v-if="settings.backdrop.shadow.preset !== 'none'"
          v-model="settings.backdrop.shadow.intensity"
          :label="t('frame.shadow.intensity')"
          :input-label="t('frame.shadow.cardIntensityInput')"
          :min="0"
          :max="MAX_FRAME_SHADOW_INTENSITY * 100"
          :step="5"
        />
      </template>
      <p class="text-[10px] leading-relaxed text-muted-foreground">{{ t('frame.shadow.hint') }}</p>
    </div>
  </div>
</template>
