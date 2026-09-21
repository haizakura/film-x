<script setup lang="ts">
const {
  images,
  rendering,
  hasImages,
  placeFile,
  placeDroppedFiles,
  removeImage,
  swapImages,
  updateImageTransform,
  resetImageTransform
} = useCompositionImages()
const {
  settings,
  geometry,
  aspectStyle,
  updateCanvasWidth,
  updateCanvasHeight,
  setCanvasSizeMode
} = useCompositionSettings(images)
const workspace = ref<{ download: () => Promise<void> }>()

const download = () => workspace.value?.download()
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
      :images="images"
      :geometry="geometry"
      :settings="settings"
      :aspect-style="aspectStyle"
      :rendering="rendering"
      @files="placeFile"
      @drop-files="placeDroppedFiles"
      @remove="removeImage"
      @swap="swapImages"
      @move-image="moveImageBy"
    />
    <FilmCompositionControls
      v-model="settings"
      :has-images="hasImages"
      :images="images"
      :geometry="geometry"
      @download="download"
      @canvas-size-mode="setCanvasSizeMode"
      @canvas-width="updateCanvasWidth"
      @canvas-height="updateCanvasHeight"
      @image-scale="setImageScale"
      @reset-image="resetImageTransform"
    />
  </main>
</template>
