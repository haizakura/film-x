<script setup lang="ts">
import type { Component } from 'vue'
import { Grid3X3, Grip, Square } from '@lucide/vue'
import type { CompositionPattern, CompositionSettings } from '~/types/composition'

const settings = defineModel<CompositionSettings>({ required: true })
const { t } = useI18n()

const patterns = computed<Array<{ label: string; value: CompositionPattern; icon: Component }>>(
  () => [
    { label: t('composition.background.solid'), value: 'none', icon: Square },
    { label: t('composition.background.grid'), value: 'grid', icon: Grid3X3 },
    { label: t('composition.background.dots'), value: 'dots', icon: Grip }
  ]
)
</script>

<template>
  <div class="border-b border-border p-5">
    <p class="text-xs font-medium">{{ t('composition.background.heading') }}</p>
    <FilmCompositionColorField
      v-model="settings.background"
      class="mt-4"
      :picker-label="t('composition.background.color')"
      :hex-label="t('composition.background.hex')"
      placeholder="#E9E4DA"
    />
    <div class="mt-4 grid grid-cols-3 gap-2">
      <button
        v-for="option in patterns"
        :key="option.value"
        class="flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-[10px] transition"
        :class="
          settings.pattern === option.value
            ? 'border-primary bg-accent text-accent-foreground'
            : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-accent/60'
        "
        @click="settings.pattern = option.value"
      >
        <component :is="option.icon" class="size-4" aria-hidden="true" />
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
