<script setup lang="ts">
import type { DecodedImage, SplitSettings } from '~/types/image'

const props = defineProps<{
  name?: string
  error?: string
  settings?: SplitSettings
  decoded?: DecodedImage
  loading: boolean
}>()

const emit = defineEmits<{ 'update:center': [value: number] }>()
const canvas = ref<HTMLCanvasElement>()

const drawPreview = () => {
  if (!canvas.value || !props.decoded) return

  const maxWidth = 1800
  const scale = Math.min(1, maxWidth / props.decoded.width)
  canvas.value.width = Math.round(props.decoded.width * scale)
  canvas.value.height = Math.round(props.decoded.height * scale)
  const context = canvas.value.getContext('2d')
  context?.drawImage(props.decoded.source, 0, 0, canvas.value.width, canvas.value.height)
}

watchEffect(
  () => {
    if (!props.loading && canvas.value && props.decoded) drawPreview()
  },
  { flush: 'post' }
)

const updateCenter = (event: Event) => {
  emit('update:center', Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <section class="flex min-h-140 min-w-0 flex-col bg-[#171612] lg:min-h-0">
    <div class="flex h-13 items-center justify-between border-b border-white/8 px-5 text-white/70">
      <p class="min-w-0 truncate text-xs font-medium text-white/90">{{ name }}</p>
      <div v-if="decoded" class="font-mono text-[10px] tracking-wide text-white/45">
        {{ decoded.width }} × {{ decoded.height }} PX
      </div>
    </div>

    <div
      class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-5 sm:p-8"
    >
      <div v-if="loading" class="flex flex-col items-center gap-3 text-white/50">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span class="font-mono text-[10px] tracking-widest uppercase">正在读取原片</span>
      </div>

      <div
        v-else-if="decoded && settings"
        class="relative max-h-full max-w-full overflow-hidden shadow-2xl shadow-black/50"
      >
        <canvas ref="canvas" class="block max-h-[calc(100vh-180px)] max-w-full object-contain" />
        <div
          class="pointer-events-none absolute inset-y-0 bg-amber-400/18 ring-1 ring-amber-300/80"
          :style="{
            left: `${(settings.center - settings.gap / 2) * 100}%`,
            width: `${settings.gap * 100}%`
          }"
        >
          <span
            class="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,.9)]"
          />
        </div>
        <div
          class="pointer-events-none absolute inset-x-0 bottom-3 flex justify-between px-4 font-mono text-[9px] tracking-[0.18em] text-white/80 uppercase drop-shadow"
        >
          <span>Frame 01</span>
          <span>Frame 02</span>
        </div>
      </div>

      <div v-else class="text-center text-white/50">
        <UIcon name="i-lucide-image-off" class="mx-auto mb-3 size-7" />
        <p class="text-sm">无法预览这张图像</p>
        <p v-if="error" class="mt-1 text-xs text-red-300">{{ error }}</p>
      </div>
    </div>

    <div v-if="settings" class="border-t border-white/8 bg-black/20 px-5 py-3">
      <div class="mx-auto flex max-w-xl items-center gap-4">
        <span class="font-mono text-[9px] tracking-wider text-white/35">40%</span>
        <input
          :value="settings.center"
          class="range range-dark"
          type="range"
          min="0.4"
          max="0.6"
          step="0.001"
          aria-label="分割位置"
          @input="updateCenter"
        />
        <span class="min-w-10 font-mono text-[9px] tracking-wider text-white/35">60%</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.range-dark {
  background: rgb(255 255 255 / 15%);
}

.range-dark::-webkit-slider-thumb {
  border-color: #171612;
  background: #f5d06f;
}
</style>
