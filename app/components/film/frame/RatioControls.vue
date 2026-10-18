<script setup lang="ts">
import type { FrameSettings } from '~/types/frame'

const settings = defineModel<FrameSettings>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="border-b border-border p-5">
    <p class="text-xs font-medium">{{ t('frame.ratio.heading') }}</p>
    <FilmRatioPicker
      v-model:mode="settings.ratioMode"
      v-model:ratio="settings.ratio"
      v-model:custom-width="settings.customRatioWidth"
      v-model:custom-height="settings.customRatioHeight"
      class="mt-4"
    />
    <p class="mt-3 text-[10px] leading-relaxed text-muted-foreground">
      {{ settings.ratioMode === 'auto' ? t('frame.ratio.autoHint') : t('frame.ratio.padHint') }}
    </p>
  </div>
</template>
