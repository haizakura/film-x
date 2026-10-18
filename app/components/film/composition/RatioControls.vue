<script setup lang="ts">
import type { CompositionSettings } from '~/types/composition'

const settings = defineModel<CompositionSettings>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="border-b border-border p-5">
    <p class="text-xs font-medium">{{ t('composition.ratio.heading') }}</p>
    <FilmRatioPicker
      v-model:mode="settings.ratioMode"
      v-model:ratio="settings.ratio"
      v-model:custom-width="settings.customRatioWidth"
      v-model:custom-height="settings.customRatioHeight"
      class="mt-4"
    />
    <p
      v-if="settings.ratioMode === 'auto'"
      class="mt-3 text-[10px] leading-relaxed text-muted-foreground"
    >
      {{ t('composition.ratio.autoHint') }}
    </p>
  </div>
</template>
