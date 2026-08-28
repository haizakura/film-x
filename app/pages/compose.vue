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
type RatioMode = 'preset' | 'custom' | 'auto'
type LayoutDirection = 'horizontal' | 'vertical'

interface FrameRect {
  x: number
  y: number
  width: number
  height: number
}

const CANVAS_WIDTH = 2400
const AUTO_FRAME_WIDTH = 1064
const DEFAULT_FRAME_RATIO = 2 / 3
const MIN_RATIO = 0.2
const MAX_RATIO = 5
const MAX_PADDING = 220
const MAX_GAP = 160
const fileInputs = ref<HTMLInputElement[]>([])
const canvas = ref<HTMLCanvasElement>()
const images = shallowRef<Array<PlacedImage | undefined>>([undefined, undefined])
const ratioMode = ref<RatioMode>('preset')
const ratio = ref(4 / 5)
const customRatioWidth = ref(4)
const customRatioHeight = ref(5)
const layoutDirection = ref<LayoutDirection>('horizontal')
const background = ref('#E9E4DA')
const backgroundHexInput = ref(background.value)
const pattern = ref<Pattern>('none')
const fit = ref<FitMode>('cover')
const advancedPadding = ref(false)
const paddingTop = ref(112)
const paddingRight = ref(112)
const paddingBottom = ref(112)
const paddingLeft = ref(112)
const gap = ref(48)
const outputFormat = ref<OutputFormat>('jpeg')
const outputQuality = ref(0.92)
const rendering = ref(false)
const isDragging = ref(false)
const toast = useToast()

useSeoMeta({
  title: '半格胶片排版拼图',
  description: '将两张半格胶片排版成单张图像，自定义画布、间距、布局与底纹。'
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
const clampRatio = (value: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, value))
const clampSpacing = (value: number | string, maximum: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(0, Math.round(parsed))) : 0
}
const spacingModel = (source: Ref<number>, maximum: number) =>
  computed({
    get: () => source.value,
    set: (value: number | string) => {
      source.value = clampSpacing(value, maximum)
    }
  })
const paddingModel = computed({
  get: () => paddingTop.value,
  set: (value: number | string) => {
    const next = clampSpacing(value, MAX_PADDING)
    paddingTop.value = next
    paddingRight.value = next
    paddingBottom.value = next
    paddingLeft.value = next
  }
})
const paddingTopModel = spacingModel(paddingTop, MAX_PADDING)
const paddingRightModel = spacingModel(paddingRight, MAX_PADDING)
const paddingBottomModel = spacingModel(paddingBottom, MAX_PADDING)
const paddingLeftModel = spacingModel(paddingLeft, MAX_PADDING)
const gapModel = spacingModel(gap, MAX_GAP)
const isMixedPadding = computed(
  () =>
    paddingTop.value !== paddingRight.value ||
    paddingTop.value !== paddingBottom.value ||
    paddingTop.value !== paddingLeft.value
)
const paddingInsets = computed(() => ({
  top: paddingTop.value,
  right: paddingRight.value,
  bottom: paddingBottom.value,
  left: paddingLeft.value
}))
const customRatio = computed(() => {
  const width = Number(customRatioWidth.value)
  const height = Number(customRatioHeight.value)
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? clampRatio(width / height)
    : 1
})
const commonFrameRatio = computed(() => {
  const loadedRatios = images.value.flatMap((entry) =>
    entry ? [clampRatio(entry.decoded.width / entry.decoded.height)] : []
  )
  if (!loadedRatios.length) return DEFAULT_FRAME_RATIO
  return loadedRatios.reduce((sum, value) => sum + value, 0) / loadedRatios.length
})
const geometry = computed(() => {
  const { top, right, bottom, left } = paddingInsets.value
  if (ratioMode.value === 'auto') {
    const frameWidth = AUTO_FRAME_WIDTH
    const frameHeight = Math.max(1, Math.round(frameWidth / commonFrameRatio.value))
    const horizontal = layoutDirection.value === 'horizontal'
    const width = horizontal ? left + right + frameWidth * 2 + gap.value : left + right + frameWidth
    const height = horizontal
      ? top + bottom + frameHeight
      : top + bottom + frameHeight * 2 + gap.value
    const frames: FrameRect[] = [0, 1].map((index) => ({
      x: horizontal ? left + index * (frameWidth + gap.value) : left,
      y: horizontal ? top : top + index * (frameHeight + gap.value),
      width: frameWidth,
      height: frameHeight
    }))
    return { width, height, frames }
  }

  const selectedRatio = ratioMode.value === 'custom' ? customRatio.value : ratio.value
  const width = CANVAS_WIDTH
  const height = Math.max(1, Math.round(width / selectedRatio))
  const horizontal = layoutDirection.value === 'horizontal'
  const frameWidth = horizontal
    ? Math.max(1, (width - left - right - gap.value) / 2)
    : Math.max(1, width - left - right)
  const frameHeight = horizontal
    ? Math.max(1, height - top - bottom)
    : Math.max(1, (height - top - bottom - gap.value) / 2)
  const frames: FrameRect[] = [0, 1].map((index) => ({
    x: horizontal ? left + index * (frameWidth + gap.value) : left,
    y: horizontal ? top : top + index * (frameHeight + gap.value),
    width: frameWidth,
    height: frameHeight
  }))
  return { width, height, frames }
})
const aspectStyle = computed(() => ({
  aspectRatio: `${geometry.value.width} / ${geometry.value.height}`
}))

const selectPresetRatio = (value: number) => {
  ratioMode.value = 'preset'
  ratio.value = value
}

const normalizeHexColor = (value: string) => {
  const hex = value.trim().replace(/^#/, '')
  return /^[\dA-Fa-f]{6}$/.test(hex) ? `#${hex.toUpperCase()}` : undefined
}

const updateBackgroundHex = () => {
  const normalized = normalizeHexColor(backgroundHexInput.value)
  if (normalized) background.value = normalized
}

const commitBackgroundHex = () => {
  const normalized = normalizeHexColor(backgroundHexInput.value)
  backgroundHexInput.value = normalized || background.value.toUpperCase()
  if (normalized) background.value = normalized
}

watch(background, (value) => {
  backgroundHexInput.value = value.toUpperCase()
})

const pickFile = (index: number) => fileInputs.value[index]?.click()

const placeFiles = async (assignments: Array<{ index: number; file: File }>) => {
  rendering.value = true
  try {
    const decodedAssignments = await Promise.all(
      assignments.map(async ({ index, file }) => {
        try {
          return { index, file, decoded: await decodeImage(file) }
        } catch (error) {
          toast.add({
            title: `无法读取 ${file.name}`,
            description: error instanceof Error ? error.message : '图像解码失败',
            color: 'error'
          })
          return undefined
        }
      })
    )
    const next = [...images.value]
    for (const assignment of decodedAssignments) {
      if (!assignment) continue
      const { index, file, decoded } = assignment
      next[index]?.decoded.dispose()
      next[index] = { name: file.name, decoded }
    }
    if (decodedAssignments.some(Boolean)) {
      images.value = next
    }
    await nextTick()
    drawCanvas()
  } finally {
    rendering.value = false
  }
}

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

  await placeFiles([{ index, file }])
}

const handleDragOver = (event: DragEvent) => {
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

const handleDragLeave = (event: DragEvent) => {
  const section = event.currentTarget as HTMLElement
  const nextTarget = event.relatedTarget as Node | null
  if (!nextTarget || !section.contains(nextTarget)) isDragging.value = false
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const files = [...(event.dataTransfer?.files || [])]
  const supported = files.filter(isSupportedImage)
  const rejectedCount = files.length - supported.length

  if (!supported.length) {
    if (files.length) {
      toast.add({
        title: '没有可用的图像',
        description: '请选择 TIFF、JPEG、PNG 或 WebP。',
        color: 'warning'
      })
    }
    return
  }

  const emptySlots = [0, 1].filter((index) => !images.value[index])
  const occupiedSlots = [0, 1].filter((index) => images.value[index])
  const targets = [...emptySlots, ...occupiedSlots]
  const selectedFiles = supported.slice(0, 2)
  await placeFiles(selectedFiles.map((file, index) => ({ index: targets[index] ?? index, file })))

  if (supported.length > selectedFiles.length) {
    toast.add({
      title: '已加入前两张图像',
      description: '排版画布最多放置两张图像。',
      color: 'warning'
    })
  } else if (rejectedCount) {
    toast.add({
      title: `已忽略 ${rejectedCount} 个不支持的文件`,
      description: '支持 TIFF、JPEG、PNG 与 WebP。',
      color: 'warning'
    })
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
  const { width, height, frames } = geometry.value
  target.width = width
  target.height = height
  const context = target.getContext('2d')
  if (!context) return

  context.fillStyle = background.value
  context.fillRect(0, 0, width, height)
  drawPattern(context, width, height)

  images.value.forEach((entry, index) => {
    const frame = frames[index]
    if (!frame) return
    context.save()
    context.shadowColor = 'rgba(0,0,0,.18)'
    context.shadowBlur = 30
    context.shadowOffsetY = 12
    if (entry) {
      drawPlacedImage(context, entry.decoded, frame.x, frame.y, frame.width, frame.height)
    } else {
      drawPlaceholder(context, frame.x, frame.y, frame.width, frame.height, index)
    }
    context.restore()
  })
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

watch([geometry, background, pattern, fit], () => requestAnimationFrame(drawCanvas))

onMounted(drawCanvas)
onBeforeUnmount(() => images.value.forEach((entry) => entry?.decoded.dispose()))
</script>

<template>
  <main class="grid w-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_350px] lg:overflow-y-auto">
    <section
      class="relative flex min-h-[620px] min-w-0 flex-col overflow-hidden bg-[#10100f] lg:min-h-0"
      @dragenter.prevent="isDragging = true"
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
            class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-white/55 transition hover:bg-white/8 hover:text-white"
            :disabled="!hasImages"
            @click="swapImages"
          >
            <UIcon
              :name="
                layoutDirection === 'horizontal'
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
              images[index] ? '点击替换 · 支持拖拽' : 'TIFF · JPEG · PNG · WEBP'
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

      <div
        v-if="isDragging"
        class="pointer-events-none absolute inset-0 z-30 grid place-items-center border-2 border-dashed border-orange-300/70 bg-black/72 text-center text-white backdrop-blur-sm"
      >
        <div>
          <UIcon name="i-lucide-images" class="mx-auto size-8 text-orange-300" />
          <p class="mt-3 text-sm font-semibold">松开以加入排版画布</p>
          <p class="mt-1 font-mono text-[9px] tracking-wider text-white/45 uppercase">
            最多读取前两张图像
          </p>
        </div>
      </div>
    </section>

    <aside class="panel-surface min-h-0 overflow-hidden lg:flex lg:flex-col">
      <div class="controls-scroll min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
        <div class="border-b border-film-900/10 p-5">
          <p class="eyebrow">画布比例</p>
          <div class="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-film-200/75 p-1">
            <button
              v-for="option in ratios"
              :key="option.label"
              class="rounded-md py-2 font-mono text-[10px] transition"
              :class="
                ratioMode === 'preset' && ratio === option.value
                  ? 'bg-film-100 text-film-900 shadow-sm'
                  : 'text-film-500 hover:text-film-900'
              "
              @click="selectPresetRatio(option.value)"
            >
              {{ option.label }}
            </button>
            <button
              class="rounded-md py-2 text-[10px] transition"
              :class="
                ratioMode === 'auto'
                  ? 'bg-film-100 font-medium text-film-900 shadow-sm'
                  : 'text-film-500 hover:text-film-900'
              "
              @click="ratioMode = 'auto'"
            >
              自动
            </button>
            <button
              class="rounded-md py-2 text-[10px] transition"
              :class="
                ratioMode === 'custom'
                  ? 'bg-film-100 font-medium text-film-900 shadow-sm'
                  : 'text-film-500 hover:text-film-900'
              "
              @click="ratioMode = 'custom'"
            >
              自定义
            </button>
          </div>

          <div v-if="ratioMode === 'custom'" class="mt-3 flex items-center gap-2">
            <label class="min-w-0 flex-1">
              <span class="sr-only">自定义比例宽度</span>
              <input
                v-model.number="customRatioWidth"
                class="w-full rounded-md border border-film-900/12 bg-film-100 px-3 py-2 text-center font-mono text-xs outline-none focus:border-orange-500"
                type="number"
                min="1"
                max="99"
                step="1"
                aria-label="自定义比例宽度"
              />
            </label>
            <span class="font-mono text-xs text-film-400">:</span>
            <label class="min-w-0 flex-1">
              <span class="sr-only">自定义比例高度</span>
              <input
                v-model.number="customRatioHeight"
                class="w-full rounded-md border border-film-900/12 bg-film-100 px-3 py-2 text-center font-mono text-xs outline-none focus:border-orange-500"
                type="number"
                min="1"
                max="99"
                step="1"
                aria-label="自定义比例高度"
              />
            </label>
          </div>
          <p
            v-else-if="ratioMode === 'auto'"
            class="mt-3 text-[10px] leading-relaxed text-film-500"
          >
            根据图像比例与当前间距自动调整导出尺寸。
          </p>
        </div>

        <div class="border-b border-film-900/10 p-5">
          <p class="eyebrow">画面布局</p>
          <div class="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-film-200/75 p-1">
            <button
              class="flex items-center justify-center gap-2 rounded-md py-2 text-[11px] transition"
              :class="
                layoutDirection === 'horizontal'
                  ? 'bg-film-100 font-medium text-film-900 shadow-sm'
                  : 'text-film-500 hover:text-film-900'
              "
              @click="layoutDirection = 'horizontal'"
            >
              <UIcon name="i-lucide-columns-2" class="size-3.5" />
              左右
            </button>
            <button
              class="flex items-center justify-center gap-2 rounded-md py-2 text-[11px] transition"
              :class="
                layoutDirection === 'vertical'
                  ? 'bg-film-100 font-medium text-film-900 shadow-sm'
                  : 'text-film-500 hover:text-film-900'
              "
              @click="layoutDirection = 'vertical'"
            >
              <UIcon name="i-lucide-rows-2" class="size-3.5" />
              上下
            </button>
          </div>
        </div>

        <div class="border-b border-film-900/10 p-5">
          <p class="eyebrow">背景与底纹</p>
          <div class="mt-4 flex items-center gap-2">
            <label class="shrink-0">
              <span class="sr-only">选择背景颜色</span>
              <input
                v-model="background"
                type="color"
                class="size-9 rounded-md border border-film-900/12 bg-transparent p-0.5"
                aria-label="选择背景颜色"
              />
            </label>
            <label class="min-w-0 flex-1">
              <span class="sr-only">背景颜色十六进制 RGB 值</span>
              <input
                v-model="backgroundHexInput"
                class="w-full rounded-md border border-film-900/12 bg-film-100 px-3 py-2 font-mono text-xs uppercase outline-none transition focus:border-orange-500"
                type="text"
                maxlength="7"
                autocomplete="off"
                spellcheck="false"
                aria-label="背景颜色十六进制 RGB 值"
                placeholder="#E9E4DA"
                @input="updateBackgroundHex"
                @blur="commitBackgroundHex"
                @keydown.enter="commitBackgroundHex"
              />
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
            <div class="flex items-center justify-between gap-3 text-xs">
              <span class="font-medium">外边距</span>
              <label class="flex items-center gap-2 text-[10px] text-film-500">
                独立设置
                <USwitch
                  v-model="advancedPadding"
                  size="sm"
                  checked-icon="i-lucide-check"
                  aria-label="分别设置四边外边距"
                />
              </label>
            </div>

            <div v-if="!advancedPadding && !isMixedPadding" class="mt-4 flex items-center gap-3">
              <input
                v-model.number="paddingModel"
                class="range min-w-0 flex-1"
                type="range"
                min="0"
                :max="MAX_PADDING"
                step="4"
                aria-label="统一外边距"
              />
              <label
                class="flex shrink-0 items-center gap-1 rounded-md border border-film-900/12 bg-film-100 px-2"
              >
                <span class="sr-only">输入统一外边距</span>
                <input
                  v-model.number="paddingModel"
                  class="w-12 bg-transparent py-1.5 text-right font-mono text-[10px] outline-none"
                  type="number"
                  min="0"
                  :max="MAX_PADDING"
                  step="1"
                  aria-label="输入统一外边距"
                />
                <span class="font-mono text-[9px] text-film-400">px</span>
              </label>
            </div>

            <div
              v-else-if="!advancedPadding"
              class="mt-4 flex items-center justify-between gap-3 rounded-md bg-film-200/65 px-3 py-2.5"
            >
              <p class="font-mono text-[9px] leading-relaxed text-film-500">
                上 {{ paddingTop }} · 右 {{ paddingRight }} · 下 {{ paddingBottom }} · 左
                {{ paddingLeft }} px
              </p>
              <button
                class="shrink-0 text-[10px] font-medium text-film-700 hover:text-film-900"
                @click="advancedPadding = true"
              >
                展开编辑
              </button>
            </div>

            <div v-else class="mt-4 grid grid-cols-2 gap-2">
              <label
                class="flex items-center gap-2 rounded-md border border-film-900/12 bg-film-100 px-2.5"
              >
                <span class="w-4 text-[10px] text-film-500">上</span>
                <input
                  v-model.number="paddingTopModel"
                  class="min-w-0 flex-1 bg-transparent py-2 text-right font-mono text-[10px] outline-none"
                  type="number"
                  min="0"
                  :max="MAX_PADDING"
                  step="1"
                  aria-label="上边距"
                />
                <span class="font-mono text-[9px] text-film-400">px</span>
              </label>
              <label
                class="flex items-center gap-2 rounded-md border border-film-900/12 bg-film-100 px-2.5"
              >
                <span class="w-4 text-[10px] text-film-500">右</span>
                <input
                  v-model.number="paddingRightModel"
                  class="min-w-0 flex-1 bg-transparent py-2 text-right font-mono text-[10px] outline-none"
                  type="number"
                  min="0"
                  :max="MAX_PADDING"
                  step="1"
                  aria-label="右边距"
                />
                <span class="font-mono text-[9px] text-film-400">px</span>
              </label>
              <label
                class="flex items-center gap-2 rounded-md border border-film-900/12 bg-film-100 px-2.5"
              >
                <span class="w-4 text-[10px] text-film-500">下</span>
                <input
                  v-model.number="paddingBottomModel"
                  class="min-w-0 flex-1 bg-transparent py-2 text-right font-mono text-[10px] outline-none"
                  type="number"
                  min="0"
                  :max="MAX_PADDING"
                  step="1"
                  aria-label="下边距"
                />
                <span class="font-mono text-[9px] text-film-400">px</span>
              </label>
              <label
                class="flex items-center gap-2 rounded-md border border-film-900/12 bg-film-100 px-2.5"
              >
                <span class="w-4 text-[10px] text-film-500">左</span>
                <input
                  v-model.number="paddingLeftModel"
                  class="min-w-0 flex-1 bg-transparent py-2 text-right font-mono text-[10px] outline-none"
                  type="number"
                  min="0"
                  :max="MAX_PADDING"
                  step="1"
                  aria-label="左边距"
                />
                <span class="font-mono text-[9px] text-film-400">px</span>
              </label>
            </div>
          </div>
          <div>
            <div class="mb-3 flex items-center justify-between text-xs">
              <span class="font-medium">画面间距</span>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model.number="gapModel"
                class="range min-w-0 flex-1"
                type="range"
                min="0"
                :max="MAX_GAP"
                step="4"
                aria-label="画面间距"
              />
              <label
                class="flex shrink-0 items-center gap-1 rounded-md border border-film-900/12 bg-film-100 px-2"
              >
                <span class="sr-only">输入画面间距</span>
                <input
                  v-model.number="gapModel"
                  class="w-12 bg-transparent py-1.5 text-right font-mono text-[10px] outline-none"
                  type="number"
                  min="0"
                  :max="MAX_GAP"
                  step="1"
                  aria-label="输入画面间距"
                />
                <span class="font-mono text-[9px] text-film-400">px</span>
              </label>
            </div>
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

.controls-scroll {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--color-film-500) 58%, transparent) transparent;
}

.controls-scroll::-webkit-scrollbar {
  width: 6px;
}

.controls-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.controls-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-film-500) 58%, transparent);
}
</style>
