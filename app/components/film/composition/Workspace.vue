<script setup lang="ts">
import type {
  CompositionGeometry,
  CompositionImage,
  CompositionSettings
} from '~/types/composition'

const props = defineProps<{
  images: Array<CompositionImage | undefined>
  geometry: CompositionGeometry
  settings: CompositionSettings
  aspectStyle: Record<string, string>
  rendering: boolean
}>()

const emit = defineEmits<{
  files: [index: number, file: File]
  'drop-files': [files: File[]]
  remove: [index: number]
  swap: []
}>()

const { canvas, download } = useCompositionCanvas(
  () => props.images,
  () => props.geometry,
  () => props.settings
)
const { isDragging, handleDragEnter, handleDragOver, handleDragLeave, handleDrop } = useImageDrop(
  (files) => emit('drop-files', files)
)

const handleSlotFiles = (index: number, files: File[]) => {
  const file = files[0]
  if (file) emit('files', index, file)
}

defineExpose({ download })
</script>

<template>
  <section
    class="relative flex min-h-155 min-w-0 flex-col overflow-hidden bg-[#10100f] lg:min-h-0"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div
      class="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 text-white/70"
    >
      <div>
        <p class="font-mono text-[9px] tracking-[0.18em] text-orange-300 uppercase">
          Tool 02 · Composer
        </p>
        <h2 class="mt-1 text-sm font-semibold text-white">半格胶片排版拼图</h2>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-white/55 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!images.some(Boolean)"
          @click="emit('swap')"
        >
          <UIcon
            :name="
              settings.layoutDirection === 'horizontal'
                ? 'i-lucide-arrow-left-right'
                : 'i-lucide-arrow-up-down'
            "
            class="size-3.5"
          />
          交换位置
        </button>
        <span class="font-mono text-[9px] text-white/35">
          {{ geometry.width }} × {{ geometry.height }} PX
        </span>
      </div>
    </div>

    <div
      class="composition-stage flex min-h-0 flex-1 items-center justify-center overflow-hidden p-5 sm:p-8 lg:p-10"
    >
      <div
        class="relative flex max-h-full max-w-full items-center justify-center"
        :style="aspectStyle"
      >
        <canvas
          ref="canvas"
          class="block max-h-full max-w-full bg-white shadow-2xl shadow-black/50"
        />
        <div
          v-if="rendering"
          class="absolute inset-0 grid place-items-center bg-black/40 text-white backdrop-blur-sm"
        >
          <UIcon name="i-lucide-loader-circle" class="size-7 animate-spin" />
        </div>
      </div>
    </div>

    <FilmCompositionImageSlots
      :images="images"
      @files="handleSlotFiles"
      @remove="emit('remove', $event)"
    />

    <FilmDropOverlay
      v-if="isDragging"
      mode="container"
      title="松开以加入排版画布"
      description="最多读取前两张图像"
    />
  </section>
</template>

<style scoped>
.composition-stage {
  background-color: #181817;
  background-image:
    linear-gradient(45deg, rgb(255 255 255 / 2.5%) 25%, transparent 25%),
    linear-gradient(-45deg, rgb(255 255 255 / 2.5%) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgb(255 255 255 / 2.5%) 75%),
    linear-gradient(-45deg, transparent 75%, rgb(255 255 255 / 2.5%) 75%);
  background-position:
    0 0,
    0 16px,
    16px -16px,
    -16px 0;
  background-size: 32px 32px;
}

canvas {
  width: auto;
  height: auto;
}
</style>
