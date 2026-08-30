<script setup lang="ts">
const { images, rendering, hasImages, placeFile, placeDroppedFiles, removeImage, swapImages } =
  useCompositionImages()
const { settings, geometry, aspectStyle } = useCompositionSettings(images)
const workspace = ref<{ download: () => Promise<void> }>()

const download = () => workspace.value?.download()
</script>

<template>
  <main class="grid w-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_350px] lg:overflow-y-auto">
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
    />
    <FilmCompositionControls v-model="settings" :has-images="hasImages" @download="download" />
  </main>
</template>
