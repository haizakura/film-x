<script setup lang="ts">
import type {
  CompositionCanvasSizeMode,
  CompositionFrameCount,
  CompositionFrameFormat,
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
  'frame-format': [value: CompositionFrameFormat]
  'frame-count': [value: CompositionFrameCount]
  'canvas-size-mode': [value: CompositionCanvasSizeMode]
  'canvas-width': [value: string]
  'canvas-height': [value: string]
  'image-scale': [index: number, value: number]
  'reset-image': [index: number]
}>()
const { t } = useI18n()

const tabs = computed(() => [
  { value: 'canvas', label: t('toolPanel.canvas') },
  { value: 'layout', label: t('toolPanel.layout') },
  { value: 'style', label: t('toolPanel.style') },
  { value: 'export', label: t('toolPanel.export') }
])
</script>

<template>
  <FilmToolPanel class="panel-surface" :tabs="tabs">
    <template #canvas>
      <FilmCompositionFrameControls
        :format="settings.frameFormat"
        :count="settings.frameCount"
        @update:format="emit('frame-format', $event)"
        @update:count="emit('frame-count', $event)"
      />
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
        :images="images"
        @scale="emit('image-scale', $event.index, $event.value)"
        @reset="emit('reset-image', $event)"
      />
    </template>
    <template #layout>
      <FilmCompositionLayoutControls v-if="settings.frameCount > 1" v-model="settings" />
      <FilmCompositionSpacingControls v-model="settings" />
    </template>
    <template #style>
      <FilmCompositionBackgroundControls v-model="settings" />
      <FilmCompositionSprocketControls v-model="settings" />
      <FilmCompositionTextureControls v-model="settings" />
    </template>
    <template #export>
      <FilmCompositionExportControls
        v-model="settings"
        :has-images="hasImages"
        @download="emit('download')"
      />
    </template>
  </FilmToolPanel>
</template>
