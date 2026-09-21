<script setup lang="ts">
import type {
  CompositionCanvasSizeMode,
  CompositionGeometry,
  CompositionImage,
  CompositionSettings
} from '~/types/composition'

defineProps<{
  hasImages: boolean
  images: Array<CompositionImage | undefined>
  geometry: CompositionGeometry
}>()
const settings = defineModel<CompositionSettings>({ required: true })
const emit = defineEmits<{
  download: []
  'canvas-size-mode': [value: CompositionCanvasSizeMode]
  'canvas-width': [value: string]
  'canvas-height': [value: string]
  'image-scale': [index: number, value: number]
  'reset-image': [index: number]
}>()
</script>

<template>
  <aside class="panel-surface min-h-0 overflow-hidden lg:flex lg:flex-col">
    <div class="controls-scroll min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
      <FilmCompositionRatioControls v-model="settings" />
      <FilmCompositionCanvasSizeControls
        :geometry="geometry"
        :mode="settings.canvasSizeMode"
        @update:mode="emit('canvas-size-mode', $event)"
        @update:width="emit('canvas-width', $event)"
        @update:height="emit('canvas-height', $event)"
      />
      <FilmCompositionImageTransformControls
        v-if="settings.canvasSizeMode === 'manual'"
        :enabled="settings.canvasSizeMode === 'manual'"
        :images="images"
        @scale="emit('image-scale', $event.index, $event.value)"
        @reset="emit('reset-image', $event)"
      />
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
