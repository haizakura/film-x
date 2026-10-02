<script setup lang="ts">
import { ArrowLeftRight, ArrowUpDown, LoaderCircle } from '@lucide/vue'
import { getCompositionOutputGeometry } from '~/types/composition'
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
const { t } = useI18n()

const emit = defineEmits<{
  files: [index: number, file: File]
  'drop-files': [files: File[]]
  remove: [index: number]
  swap: []
  'move-image': [index: number, offsetX: number, offsetY: number]
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

let pointerDrag:
  | {
      pointerId: number
      index: number
      x: number
      y: number
    }
  | undefined

const canvasPoint = (event: PointerEvent) => {
  const target = canvas.value
  if (!target) return
  const bounds = target.getBoundingClientRect()
  if (!bounds.width || !bounds.height) return
  const outputGeometry = getCompositionOutputGeometry(props.geometry, props.settings.sprocket)
  return {
    x:
      ((event.clientX - bounds.left) * outputGeometry.width) / bounds.width -
      outputGeometry.contentOffsetX,
    y:
      ((event.clientY - bounds.top) * outputGeometry.height) / bounds.height -
      outputGeometry.contentOffsetY
  }
}

const handleCanvasPointerDown = (event: PointerEvent) => {
  if (props.settings.canvasSizeMode !== 'manual' || event.button !== 0) return
  const point = canvasPoint(event)
  if (!point) return
  const index = props.geometry.frames.findIndex(
    (frame, frameIndex) =>
      props.images[frameIndex] &&
      point.x >= frame.x &&
      point.x <= frame.x + frame.width &&
      point.y >= frame.y &&
      point.y <= frame.y + frame.height
  )
  if (index < 0) return

  pointerDrag = { pointerId: event.pointerId, index, ...point }
  const target = event.currentTarget as HTMLCanvasElement
  target.setPointerCapture(event.pointerId)
  event.preventDefault()
}

const handleCanvasPointerMove = (event: PointerEvent) => {
  if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return
  const point = canvasPoint(event)
  if (!point) return

  emit('move-image', pointerDrag.index, point.x - pointerDrag.x, point.y - pointerDrag.y)
  pointerDrag.x = point.x
  pointerDrag.y = point.y
}

const finishCanvasPointerDrag = (event: PointerEvent) => {
  if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return
  const target = event.currentTarget as HTMLCanvasElement
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
  pointerDrag = undefined
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
        <p class="font-mono text-[9px] tracking-[0.18em] text-white/45 uppercase">
          {{ t('composition.eyebrow') }}
        </p>
        <h2 class="mt-1 text-sm font-semibold text-white">{{ t('composition.title') }}</h2>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="settings.frameCount > 1"
          class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-white/55 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!images.some(Boolean)"
          @click="emit('swap')"
        >
          <ArrowLeftRight
            v-if="settings.layoutDirection === 'horizontal'"
            class="size-3.5"
            aria-hidden="true"
          />
          <ArrowUpDown v-else class="size-3.5" aria-hidden="true" />
          {{ t('composition.swap') }}
        </button>
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
          class="block max-h-full max-w-full shadow-2xl shadow-black/50"
          :class="[
            settings.outputFormat === 'png' && settings.sprocket.enabled
              ? 'composition-canvas-transparency'
              : '',
            settings.canvasSizeMode === 'manual' && images.some(Boolean)
              ? 'touch-none cursor-grab active:cursor-grabbing'
              : ''
          ]"
          @pointerdown="handleCanvasPointerDown"
          @pointermove="handleCanvasPointerMove"
          @pointerup="finishCanvasPointerDrag"
          @pointercancel="finishCanvasPointerDrag"
        />
        <div
          v-if="rendering"
          class="absolute inset-0 grid place-items-center bg-black/40 text-white backdrop-blur-sm"
        >
          <LoaderCircle class="size-7 animate-spin" aria-hidden="true" />
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
      :title="t('drop.compositionTitle')"
      :description="
        settings.frameCount > 1
          ? t('drop.compositionDescription')
          : t('drop.compositionDescriptionSingle')
      "
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

.composition-canvas-transparency {
  background-color: #e4e2dc;
  background-image:
    linear-gradient(45deg, rgb(0 0 0 / 9%) 25%, transparent 25%),
    linear-gradient(-45deg, rgb(0 0 0 / 9%) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgb(0 0 0 / 9%) 75%),
    linear-gradient(-45deg, transparent 75%, rgb(0 0 0 / 9%) 75%);
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
  background-size: 16px 16px;
}
</style>
