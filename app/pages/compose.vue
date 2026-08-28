<script setup lang="ts">
import type { DecodedImage } from '~/types/image'
import { decodeImage, isSupportedImage } from '~/utils/image'

interface PlacedImage {
  name: string
  decoded: DecodedImage
}

type Pattern = 'none' | 'grid' | 'dots'
type FitMode = 'cover' | 'contain'
type OutputFormat = 'jpeg' | 'png'

const CANVAS_WIDTH = 2400
const fileInputs = ref<HTMLInputElement[]>([])
const canvas = ref<HTMLCanvasElement>()
const images = shallowRef<Array<PlacedImage | undefined>>([undefined, undefined])
const ratio = ref(4 / 5)
const background = ref('#E9E4DA')
const pattern = ref<Pattern>('none')
const fit = ref<FitMode>('cover')
const padding = ref(112)
const gap = ref(48)
const caption = ref('')
const showFrameNumbers = ref(false)
const outputFormat = ref<OutputFormat>('jpeg')
const outputQuality = ref(0.92)
const rendering = ref(false)
const toast = useToast()

useSeoMeta({
  title: '半格胶片排版拼图',
  description: '将两张半格胶片排版成单张图像，自定义画布、间距、底纹与文字。'
})

const ratios = [
  { label: '4:5', value: 4 / 5 },
  { label: '1:1', value: 1 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 }
]

const patterns: Array<{ label: string; value: Pattern; icon: string }> = [
  { label: '纯色', value: 'none', icon: 'i-lucide-square' },
  { label: '方格', value: 'grid', icon: 'i-lucide-grid-3x3' },
  { label: '圆点', value: 'dots', icon: 'i-lucide-grip' }
]

const hasImages = computed(() => images.value.some(Boolean))
const canvasHeight = computed(() => Math.round(CANVAS_WIDTH / ratio.value))
const aspectStyle = computed(() => ({ aspectRatio: String(ratio.value) }))

const pickFile = (index: number) => fileInputs.value[index]?.click()

const handleInput = async (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!isSupportedImage(file)) {
    toast.add({
      title: '不支持这个文件',
      description: '请选择 TIFF、JPEG、PNG 或 WebP。',
      color: 'warning'
    })
    return
  }

  rendering.value = true
  try {
    const decoded = await decodeImage(file)
    images.value[index]?.decoded.dispose()
    const next = [...images.value]
    next[index] = { name: file.name, decoded }
    images.value = next
    await nextTick()
    drawCanvas()
  } catch (error) {
    toast.add({
      title: '无法读取图像',
      description: error instanceof Error ? error.message : '图像解码失败',
      color: 'error'
    })
  } finally {
    rendering.value = false
  }
}

const removeImage = (index: number) => {
  images.value[index]?.decoded.dispose()
  const next = [...images.value]
  next[index] = undefined
  images.value = next
  drawCanvas()
}

const swapImages = () => {
  images.value = [images.value[1], images.value[0]]
  drawCanvas()
}

const isLightColor = (hex: string) => {
  const value = hex.replace('#', '')
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return red * 0.299 + green * 0.587 + blue * 0.114 > 145
}

const drawPattern = (context: CanvasRenderingContext2D, width: number, height: number) => {
  if (pattern.value === 'none') return
  const foreground = isLightColor(background.value) ? 'rgba(20,20,20,.09)' : 'rgba(255,255,255,.1)'
  context.save()
  context.strokeStyle = foreground
  context.fillStyle = foreground
  context.lineWidth = 2

  if (pattern.value === 'grid') {
    const step = 64
    for (let x = 0; x <= width; x += step) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, height)
      context.stroke()
    }
    for (let y = 0; y <= height; y += step) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(width, y)
      context.stroke()
    }
  } else {
    const step = 52
    for (let x = step / 2; x < width; x += step) {
      for (let y = step / 2; y < height; y += step) {
        context.beginPath()
        context.arc(x, y, 3.2, 0, Math.PI * 2)
        context.fill()
      }
    }
  }
  context.restore()
}

const drawPlacedImage = (
  context: CanvasRenderingContext2D,
  image: DecodedImage,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const scale =
    fit.value === 'cover'
      ? Math.max(width / image.width, height / image.height)
      : Math.min(width / image.width, height / image.height)
  const renderWidth = image.width * scale
  const renderHeight = image.height * scale
  const renderX = x + (width - renderWidth) / 2
  const renderY = y + (height - renderHeight) / 2

  context.save()
  context.beginPath()
  context.rect(x, y, width, height)
  context.clip()
  if (fit.value === 'contain') {
    context.fillStyle = isLightColor(background.value) ? '#F7F6F2' : '#0D0D0D'
    context.fillRect(x, y, width, height)
  }
  context.drawImage(image.source, renderX, renderY, renderWidth, renderHeight)
  context.restore()
}

const drawPlaceholder = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  index: number
) => {
  const light = isLightColor(background.value)
  context.save()
  context.fillStyle = light ? 'rgba(255,255,255,.38)' : 'rgba(255,255,255,.04)'
  context.strokeStyle = light ? 'rgba(20,20,20,.22)' : 'rgba(255,255,255,.2)'
  context.lineWidth = 3
  context.setLineDash([18, 15])
  context.fillRect(x, y, width, height)
  context.strokeRect(x, y, width, height)
  context.fillStyle = light ? 'rgba(20,20,20,.5)' : 'rgba(255,255,255,.55)'
  context.font = '500 28px SFMono-Regular, monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(`FRAME 0${index + 1}`, x + width / 2, y + height / 2)
  context.restore()
}

const drawCanvas = () => {
  if (!canvas.value) return
  const target = canvas.value
  const width = CANVAS_WIDTH
  const height = canvasHeight.value
  target.width = width
  target.height = height
  const context = target.getContext('2d')
  if (!context) return

  context.fillStyle = background.value
  context.fillRect(0, 0, width, height)
  drawPattern(context, width, height)

  const captionSpace = caption.value.trim() ? 104 : 0
  const frameWidth = Math.max(1, (width - padding.value * 2 - gap.value) / 2)
  const frameHeight = Math.max(1, height - padding.value * 2 - captionSpace)
  const top = padding.value

  images.value.forEach((entry, index) => {
    const x = padding.value + index * (frameWidth + gap.value)
    context.save()
    context.shadowColor = 'rgba(0,0,0,.18)'
    context.shadowBlur = 30
    context.shadowOffsetY = 12
    if (entry) drawPlacedImage(context, entry.decoded, x, top, frameWidth, frameHeight)
    else drawPlaceholder(context, x, top, frameWidth, frameHeight, index)
    context.restore()

    if (showFrameNumbers.value) {
      context.save()
      context.fillStyle = 'rgba(255,255,255,.92)'
      context.font = '600 24px SFMono-Regular, monospace'
      context.textAlign = 'left'
      context.textBaseline = 'bottom'
      context.shadowColor = 'rgba(0,0,0,.65)'
      context.shadowBlur = 8
      context.fillText(`0${index + 1}`, x + 24, top + frameHeight - 20)
      context.restore()
    }
  })

  if (caption.value.trim()) {
    context.save()
    context.fillStyle = isLightColor(background.value) ? '#242321' : '#F3F1ED'
    context.font = '500 28px Avenir Next, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(caption.value.trim().slice(0, 80), width / 2, height - padding.value / 2)
    context.restore()
  }
}

const download = () => {
  if (!canvas.value || !hasImages.value) {
    toast.add({ title: '请先加入照片', color: 'warning' })
    return
  }
  canvas.value.toBlob(
    (blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `film-x-layout.${outputFormat.value === 'jpeg' ? 'jpg' : 'png'}`
      anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1_000)
      toast.add({ title: '排版图像已生成', color: 'success' })
    },
    `image/${outputFormat.value}`,
    outputFormat.value === 'jpeg' ? outputQuality.value : undefined
  )
}

watch([ratio, background, pattern, fit, padding, gap, caption, showFrameNumbers], () => {
  requestAnimationFrame(drawCanvas)
})

onMounted(drawCanvas)
onBeforeUnmount(() => images.value.forEach((entry) => entry?.decoded.dispose()))
</script>

<template>
  <main
    class="mx-auto grid w-full max-w-[1680px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-8 lg:py-7"
  >
    <section
      class="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-2xl bg-[#10100f] shadow-2xl shadow-black/15"
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
            class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-white/55 transition hover:bg-white/8 hover:text-white"
            :disabled="!hasImages"
            @click="swapImages"
          >
            <UIcon name="i-lucide-arrow-left-right" class="size-3.5" />
            交换位置
          </button>
          <span class="font-mono text-[9px] text-white/35">2400 × {{ canvasHeight }} PX</span>
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
            class="block max-h-[650px] max-w-full bg-white shadow-2xl shadow-black/50"
          />
          <div
            v-if="rendering"
            class="absolute inset-0 grid place-items-center bg-black/40 text-white backdrop-blur-sm"
          >
            <UIcon name="i-lucide-loader-circle" class="size-7 animate-spin" />
          </div>
        </div>
      </div>

      <div class="grid gap-2 border-t border-white/8 bg-black/20 p-3 sm:grid-cols-2">
        <div
          v-for="(_, index) in 2"
          :key="index"
          class="group flex min-w-0 items-center gap-3 rounded-lg border border-white/9 bg-white/4 p-2.5"
        >
          <input
            :ref="
              (element) => {
                if (element) fileInputs[index] = element as HTMLInputElement
              }
            "
            class="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/tiff,.tif,.tiff"
            @change="handleInput(index, $event)"
          />
          <button
            class="grid size-9 shrink-0 place-items-center rounded-md bg-white/8 text-white/70 hover:bg-white/14"
            @click="pickFile(index)"
          >
            <UIcon :name="images[index] ? 'i-lucide-image' : 'i-lucide-plus'" class="size-4" />
          </button>
          <button class="min-w-0 flex-1 text-left" @click="pickFile(index)">
            <span class="block truncate text-xs font-medium text-white/85">{{
              images[index]?.name || `选择画面 0${index + 1}`
            }}</span>
            <span class="mt-0.5 block font-mono text-[9px] text-white/35">{{
              images[index] ? '点击替换' : 'TIFF · JPEG · PNG · WEBP'
            }}</span>
          </button>
          <button
            v-if="images[index]"
            class="invisible grid size-7 place-items-center rounded text-white/40 hover:bg-white/8 hover:text-white group-hover:visible"
            :aria-label="`移除画面 0${index + 1}`"
            @click="removeImage(index)"
          >
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
        </div>
      </div>
    </section>

    <aside
      class="panel-surface self-start overflow-hidden rounded-2xl lg:max-h-[calc(100dvh-172px)] lg:overflow-y-auto"
    >
      <div class="border-b border-film-900/10 p-5">
        <p class="eyebrow">画布比例</p>
        <div class="mt-4 grid grid-cols-4 gap-1 rounded-lg bg-film-200/75 p-1">
          <button
            v-for="option in ratios"
            :key="option.label"
            class="rounded-md py-2 font-mono text-[10px] transition"
            :class="
              ratio === option.value
                ? 'bg-film-100 text-film-900 shadow-sm'
                : 'text-film-500 hover:text-film-900'
            "
            @click="ratio = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="border-b border-film-900/10 p-5">
        <div class="flex items-center justify-between">
          <p class="eyebrow">背景与底纹</p>
          <label class="flex items-center gap-2 text-[10px] text-film-500">
            <input
              v-model="background"
              type="color"
              class="size-6 rounded border-0 bg-transparent p-0"
            />
            {{ background.toUpperCase() }}
          </label>
        </div>
        <div class="mt-4 grid grid-cols-3 gap-2">
          <button
            v-for="option in patterns"
            :key="option.value"
            class="flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-[10px] transition"
            :class="
              pattern === option.value
                ? 'border-film-800 bg-film-200/70 text-film-900'
                : 'border-film-900/10 text-film-500 hover:border-film-500/50'
            "
            @click="pattern = option.value"
          >
            <UIcon :name="option.icon" class="size-4" />
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="space-y-5 border-b border-film-900/10 p-5">
        <div>
          <div class="mb-3 flex items-center justify-between text-xs">
            <span class="font-medium">外边距</span
            ><output class="font-mono text-[10px] text-film-500">{{ padding }} px</output>
          </div>
          <input v-model.number="padding" class="range" type="range" min="48" max="220" step="4" />
        </div>
        <div>
          <div class="mb-3 flex items-center justify-between text-xs">
            <span class="font-medium">画面间距</span
            ><output class="font-mono text-[10px] text-film-500">{{ gap }} px</output>
          </div>
          <input v-model.number="gap" class="range" type="range" min="0" max="160" step="4" />
        </div>
        <div class="grid grid-cols-2 gap-2 rounded-lg bg-film-200/70 p-1">
          <button
            class="rounded-md py-2 text-[11px]"
            :class="fit === 'cover' ? 'bg-film-100 font-medium shadow-sm' : 'text-film-500'"
            @click="fit = 'cover'"
          >
            填满裁切
          </button>
          <button
            class="rounded-md py-2 text-[11px]"
            :class="fit === 'contain' ? 'bg-film-100 font-medium shadow-sm' : 'text-film-500'"
            @click="fit = 'contain'"
          >
            完整显示
          </button>
        </div>
      </div>

      <div class="border-b border-film-900/10 p-5">
        <p class="eyebrow">文字内容</p>
        <input
          v-model="caption"
          maxlength="80"
          class="mt-4 w-full rounded-lg border border-film-900/12 bg-film-100 px-3 py-2.5 text-xs outline-none transition placeholder:text-film-400 focus:border-orange-500"
          placeholder="例如：TOKYO · SUMMER 2026"
        />
        <label class="mt-4 flex items-center justify-between text-xs">
          <span>显示画面编号</span>
          <USwitch v-model="showFrameNumbers" size="sm" />
        </label>
      </div>

      <div class="sticky bottom-0 space-y-3 bg-film-50/95 p-5 backdrop-blur">
        <div class="grid grid-cols-2 gap-1 rounded-lg bg-film-200/70 p-1">
          <button
            class="rounded-md py-2 font-mono text-[10px]"
            :class="outputFormat === 'jpeg' ? 'bg-film-100 shadow-sm' : 'text-film-500'"
            @click="outputFormat = 'jpeg'"
          >
            JPG
          </button>
          <button
            class="rounded-md py-2 font-mono text-[10px]"
            :class="outputFormat === 'png' ? 'bg-film-100 shadow-sm' : 'text-film-500'"
            @click="outputFormat = 'png'"
          >
            PNG
          </button>
        </div>
        <UButton
          block
          color="neutral"
          size="lg"
          icon="i-lucide-download"
          :disabled="!hasImages"
          label="生成并下载"
          @click="download"
        />
        <p class="text-center font-mono text-[9px] tracking-wide text-film-400">
          LOCAL RENDER · NO UPLOAD
        </p>
      </div>
    </aside>
  </main>
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
