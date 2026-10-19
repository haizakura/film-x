<script setup lang="ts">
import '~/assets/css/frame-fonts.css'
import {
  getFrameCanvasSize,
  getFrameOutputLimit,
  getFrameScale,
  getFrameSceneLayout
} from '~/utils/photoFrame'

const {
  image: photo,
  loading,
  placeFiles: placePhoto,
  clear: clearPhoto
} = useFrameImage('frame-photo', { readExif: true })
const {
  image: customLogo,
  placeFiles: placeCustomLogo,
  clear: clearCustomLogo
} = useFrameImage('frame-logo')
const frame = useFrameSettings()
const { settings, brand, applyTemplate, selectBrand, setTagline, setSourceType } = frame
const { fields, exif, setField, applyExif, fillFromExif } = useFrameMetadata(frame)
const preset = useFramePreset(frame)
const presetCode = preset.code
const workspace = ref<{ download: () => Promise<void>; exporting: boolean }>()

watch(photo, (entry) => applyExif(entry?.exif))

const outputSize = computed(() => {
  if (!photo.value) return undefined
  const layout = getFrameSceneLayout(photo.value.decoded, settings.value)
  return getFrameCanvasSize(layout, getFrameScale(layout, getFrameOutputLimit(settings.value)))
})

const download = () => workspace.value?.download()
const chooseCustomLogo = async (files: File[]) => {
  settings.value.logo.style = 'custom'
  await placeCustomLogo(files)
}
</script>

<template>
  <main
    class="grid w-full lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden lg:[contain:paint]"
  >
    <FilmFrameWorkspace
      ref="workspace"
      :photo="photo"
      :custom-logo="customLogo"
      :settings="settings"
      :fields="fields"
      :loading="loading"
      @files="placePhoto"
      @remove="clearPhoto"
    />
    <FilmFrameControls
      v-model="settings"
      v-model:preset-code="presetCode"
      :brand="brand"
      :fields="fields"
      :exif="exif"
      :has-photo="Boolean(photo)"
      :custom-logo="customLogo"
      :output-size="outputSize"
      :exporting="workspace?.exporting ?? false"
      @template="applyTemplate"
      @brand="selectBrand"
      @wordmark-preset="frame.applyWordmarkPreset"
      @tagline="setTagline"
      @source-type="setSourceType"
      @field="setField"
      @fill-exif="fillFromExif"
      @custom-logo="chooseCustomLogo"
      @remove-custom-logo="clearCustomLogo"
      @copy-preset="preset.copy"
      @apply-preset="preset.apply"
      @download="download"
    />
  </main>
</template>
