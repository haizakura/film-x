<script setup lang="ts">
import type { CompositionSettings } from '~/types/composition'

const settings = defineModel<CompositionSettings>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="border-b border-border p-5">
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs font-medium">{{ t('composition.texture.heading') }}</p>
      <FilmToggleField
        v-model="settings.filmTexture"
        :label="t('composition.texture.enabled')"
        :aria-label="t('composition.texture.enabledLabel')"
      />
    </div>
    <p class="mt-3 text-[10px] leading-relaxed text-muted-foreground">
      {{ t('composition.texture.hint') }}
    </p>
  </div>
</template>
