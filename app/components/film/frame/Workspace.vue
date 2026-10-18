<script setup lang="ts">
import { Image as ImageIcon, LoaderCircle, Plus, X } from '@lucide/vue'
import type { FrameImageEntry } from '~/composables/useFrameImage'
import type { FrameInfoFields, FrameSettings } from '~/types/frame'
import { formatCameraName } from '~/utils/frameMetadata'

const props = defineProps<{
  photo?: FrameImageEntry
  customLogo?: FrameImageEntry
  settings: FrameSettings
  fields: FrameInfoFields
  loading: boolean
}>()
const emit = defineEmits<{
  files: [files: File[]]
  remove: []
}>()
const { t } = useI18n()
const inputId = 'frame-photo-input'

const { canvas, aspectRatio, exporting, download } = useFrameCanvas({
  photo: () => props.photo,
  customLogo: () => props.customLogo,
  settings: () => props.settings,
  fields: () => props.fields
})
const { isDragging, handleDragEnter, handleDragOver, handleDragLeave, handleDrop } = useImageDrop(
  (files) => emit('files', files)
)

const pickFile = () => document.getElementById(inputId)?.click()
const exifSummary = computed(() => {
  const exif = props.photo?.exif
  if (!props.photo) return ''
  if (!exif) return t('frame.exifMissing')
  const camera = exif.make || exif.model ? formatCameraName(exif) : ''
  return camera ? t('frame.exifFound', { camera }) : t('frame.exifPartial')
})

defineExpose({ download, exporting })
</script>

<template>
  <section
    class="relative flex min-h-155 min-w-0 flex-col overflow-hidden bg-workbench lg:min-h-0"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <FilmImageFileInput :id="inputId" input-class="hidden" @files="emit('files', $event)" />
    <div
      class="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 text-white/70"
    >
      <div>
        <p class="font-mono text-[9px] tracking-[0.18em] text-white/45 uppercase">
          {{ t('frame.eyebrow') }}
        </p>
        <h2 class="mt-1 text-sm font-semibold text-white">{{ t('frame.title') }}</h2>
      </div>
      <p v-if="photo" class="font-mono text-[10px] text-white/45">
        {{ t('frame.photoSize', { width: photo.decoded.width, height: photo.decoded.height }) }}
      </p>
    </div>

    <div
      class="frame-stage flex min-h-0 flex-1 items-center justify-center overflow-hidden p-5 sm:p-8 lg:p-10"
    >
      <div
        class="relative flex max-h-full max-w-full items-center justify-center"
        :style="{ aspectRatio }"
      >
        <canvas ref="canvas" class="block max-h-full max-w-full shadow-2xl shadow-black/50" />
        <label
          v-if="!photo && !loading"
          :for="inputId"
          role="button"
          tabindex="0"
          class="absolute inset-0 cursor-pointer rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-white/60"
          :aria-label="t('frame.choosePhoto')"
          @keydown.enter.prevent="pickFile"
          @keydown.space.prevent="pickFile"
        />
        <div
          v-if="loading"
          class="absolute inset-0 grid place-items-center bg-black/40 text-white backdrop-blur-sm"
        >
          <LoaderCircle class="size-7 animate-spin" aria-hidden="true" />
        </div>
      </div>
    </div>

    <div class="border-t border-white/8 bg-black/20 p-3">
      <div
        class="group flex min-w-0 items-center gap-3 rounded-lg border border-white/9 bg-white/4 p-2.5"
      >
        <label
          :for="inputId"
          role="button"
          tabindex="0"
          class="grid size-9 shrink-0 cursor-pointer place-items-center rounded-md bg-white/8 text-white/70 hover:bg-white/14"
          :aria-label="t('frame.choosePhoto')"
          @keydown.enter.prevent="pickFile"
          @keydown.space.prevent="pickFile"
        >
          <ImageIcon v-if="photo" class="size-4" aria-hidden="true" />
          <Plus v-else class="size-4" aria-hidden="true" />
        </label>
        <label
          :for="inputId"
          role="button"
          tabindex="0"
          class="min-w-0 flex-1 cursor-pointer text-left"
          @keydown.enter.prevent="pickFile"
          @keydown.space.prevent="pickFile"
        >
          <span class="block truncate text-xs font-medium text-white/85">
            {{ photo?.name || t('frame.choosePhoto') }}
          </span>
          <span class="mt-0.5 block truncate font-mono text-[9px] text-white/35">
            {{ photo ? exifSummary : 'TIFF · JPEG · PNG · WEBP' }}
          </span>
        </label>
        <button
          v-if="photo"
          type="button"
          class="grid size-7 place-items-center rounded text-white/40 hover:bg-white/8 hover:text-white"
          :aria-label="t('frame.removePhoto')"
          :title="t('frame.removePhoto')"
          @click="emit('remove')"
        >
          <X class="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>

    <FilmDropOverlay
      v-if="isDragging"
      mode="container"
      :title="t('drop.frameTitle')"
      :description="t('drop.frameDescription')"
    />
  </section>
</template>

<style scoped>
.frame-stage {
  background: radial-gradient(circle at 50% 42%, #52514e 0%, #444341 62%, #3b3b3a 100%);
}

.dark .frame-stage {
  background: radial-gradient(circle at 50% 42%, #24231f 0%, #161614 62%, #10100f 100%);
}

canvas {
  width: auto;
  height: auto;
}
</style>
