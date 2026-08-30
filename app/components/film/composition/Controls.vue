<script setup lang="ts">
import type { CompositionSettings } from '~/types/composition'

defineProps<{ hasImages: boolean }>()
const settings = defineModel<CompositionSettings>({ required: true })
const emit = defineEmits<{ download: [] }>()
</script>

<template>
  <aside class="panel-surface min-h-0 overflow-hidden lg:flex lg:flex-col">
    <div class="controls-scroll min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
      <FilmCompositionRatioControls v-model="settings" />
      <FilmCompositionLayoutControls v-model="settings" />
      <FilmCompositionBackgroundControls v-model="settings" />
      <FilmCompositionSpacingControls v-model="settings" />
      <FilmCompositionExportControls
        v-model="settings"
        :has-images="hasImages"
        @download="emit('download')"
      />
    </div>
  </aside>
</template>

<style scoped>
.controls-scroll {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--color-film-500) 58%, transparent) transparent;
}

.controls-scroll::-webkit-scrollbar {
  width: 6px;
}

.controls-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.controls-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-film-500) 58%, transparent);
}
</style>
