<script setup lang="ts">
import {
  FRAME_FONTS,
  MAX_FRAME_LETTER_SPACING,
  MAX_FRAME_SCALE,
  MIN_FRAME_SCALE
} from '~/types/frame'
import type { FrameSettings, FrameTypography } from '~/types/frame'

const settings = defineModel<FrameSettings>({ required: true })
const { t } = useI18n()

const hasBold = (typography: FrameTypography) => Boolean(FRAME_FONTS[typography.font].bold)
const hasItalic = (typography: FrameTypography) => FRAME_FONTS[typography.font].italic
</script>

<template>
  <div class="space-y-5 border-b border-border p-5">
    <p class="text-xs font-medium">{{ t('frame.typography.heading') }}</p>

    <div v-if="settings.logo.style === 'wordmark'" class="space-y-3">
      <p class="text-[10px] font-medium text-muted-foreground uppercase">
        {{ t('frame.typography.wordmark') }}
      </p>
      <FilmFrameFontPicker
        v-model="settings.logo.typography.font"
        :label="t('frame.typography.wordmarkFont')"
      />
      <div class="grid grid-cols-3 gap-3">
        <FilmFrameToggleField
          v-model="settings.logo.typography.bold"
          :label="t('frame.typography.bold')"
          :aria-label="t('frame.typography.wordmarkBold')"
          :disabled="!hasBold(settings.logo.typography)"
        />
        <FilmFrameToggleField
          v-model="settings.logo.typography.italic"
          :label="t('frame.typography.italic')"
          :aria-label="t('frame.typography.wordmarkItalic')"
          :disabled="!hasItalic(settings.logo.typography)"
        />
        <FilmFrameToggleField
          v-model="settings.logo.typography.uppercase"
          :label="t('frame.typography.uppercase')"
          :aria-label="t('frame.typography.wordmarkUppercase')"
        />
      </div>
      <FilmFrameRangeField
        v-model="settings.logo.typography.letterSpacing"
        :label="t('frame.typography.letterSpacing')"
        :input-label="t('frame.typography.wordmarkLetterSpacingInput')"
        :min="0"
        :max="MAX_FRAME_LETTER_SPACING"
        :step="0.01"
        :factor="1"
        unit="em"
      />
    </div>

    <div class="space-y-3">
      <p class="text-[10px] font-medium text-muted-foreground uppercase">
        {{ t('frame.typography.caption') }}
      </p>
      <FilmFrameFontPicker
        v-model="settings.text.font"
        :label="t('frame.typography.captionFont')"
      />
      <div class="grid grid-cols-3 gap-3">
        <FilmFrameToggleField
          v-model="settings.text.bold"
          :label="t('frame.typography.bold')"
          :aria-label="t('frame.typography.captionBold')"
          :disabled="!hasBold(settings.text)"
        />
        <FilmFrameToggleField
          v-model="settings.text.italic"
          :label="t('frame.typography.italic')"
          :aria-label="t('frame.typography.captionItalic')"
          :disabled="!hasItalic(settings.text)"
        />
        <FilmFrameToggleField
          v-model="settings.text.uppercase"
          :label="t('frame.typography.uppercase')"
          :aria-label="t('frame.typography.captionUppercase')"
        />
      </div>
      <FilmFrameRangeField
        v-model="settings.text.letterSpacing"
        :label="t('frame.typography.letterSpacing')"
        :input-label="t('frame.typography.captionLetterSpacingInput')"
        :min="0"
        :max="MAX_FRAME_LETTER_SPACING / 2"
        :step="0.01"
        :factor="1"
        unit="em"
      />
      <FilmFrameRangeField
        v-model="settings.textScale"
        :label="t('frame.typography.size')"
        :input-label="t('frame.typography.sizeInput')"
        :min="MIN_FRAME_SCALE * 100"
        :max="MAX_FRAME_SCALE * 100"
        :step="5"
      />
    </div>
  </div>
</template>
