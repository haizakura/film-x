<script setup lang="ts">
import type { CompositionFrameCount } from '~/types/composition'

const {
  images,
  rendering,
  placeFile,
  placeDroppedFiles,
  removeImage,
  swapImages,
  updateImageTransform,
  resetImageTransform
} = useCompositionImages()
const {
  settings,
  activeImages,
  geometry,
  aspectStyle,
  updateCanvasWidth,
  updateCanvasHeight,
  setCanvasSizeMode,
  setFrameFormat,
  setFrameCount
} = useCompositionSettings(images)
const workspace = ref<{ download: () => Promise<void> }>()
const hasImages = computed(() => activeImages.value.some(Boolean))

const download = () => workspace.value?.download()
const placeActiveDroppedFiles = (files: File[]) =>
  placeDroppedFiles(files, settings.value.frameCount)
const changeFrameCount = (count: CompositionFrameCount) => {
  // Keep the only visible slot filled when the first slot is empty.
  if (count === 1 && !images.value[0] && images.value[1]) swapImages()
  setFrameCount(count)
}
const setImageScale = (index: number, scale: number) => updateImageTransform(index, { scale })
const moveImageBy = (index: number, offsetX: number, offsetY: number) => {
  const transform = images.value[index]?.transform
  if (!transform) return
  updateImageTransform(index, {
    offsetX: transform.offsetX + offsetX,
    offsetY: transform.offsetY + offsetY
  })
}
</script>

<template>
  <main
    class="grid w-full lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_350px] lg:overflow-hidden lg:[contain:paint]"
  >
    <FilmCompositionWorkspace
      ref="workspace"
      :images="activeImages"
      :geometry="geometry"
      :settings="settings"
      :aspect-style="aspectStyle"
      :rendering="rendering"
      @files="placeFile"
      @drop-files="placeActiveDroppedFiles"
      @remove="removeImage"
      @swap="swapImages"
      @move-image="moveImageBy"
    />
    <FilmCompositionControls
      v-model="settings"
      :has-images="hasImages"
      :images="activeImages"
      :geometry="geometry"
      @download="download"
      @frame-format="setFrameFormat"
      @frame-count="changeFrameCount"
      @canvas-size-mode="setCanvasSizeMode"
      @canvas-width="updateCanvasWidth"
      @canvas-height="updateCanvasHeight"
      @image-scale="setImageScale"
      @reset-image="resetImageTransform"
    />
  </main>
</template>
