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
provideToolCardSpace()
const hasImages = computed(() => activeImages.value.some(Boolean))

const download = () => workspace.value?.download()
const placeActiveDroppedFiles = (files: File[]) =>
  placeDroppedFiles(files, settings.value.frameCount)
const changeFrameCount = (count: CompositionFrameCount) => {
  // Keep the only visible slot filled when the first slot is empty.
  if (count === 1 && !images.value[0] && images.value[1] && !swapImages()) return
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
    class="grid h-full min-h-0 w-full grid-rows-[minmax(0,1fr)_auto] overflow-hidden [contain:paint] lg:grid-cols-[minmax(0,1fr)_350px] lg:grid-rows-1"
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
