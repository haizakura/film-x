<script setup lang="ts">
import { Ban, ImagePlus, Search, X } from '@lucide/vue'
import type { FrameImageEntry } from '~/composables/useFrameImage'
import {
  FRAME_WORDMARK_PRESETS,
  MAX_FRAME_SCALE,
  MAX_FRAME_TEXT_LENGTH,
  MIN_FRAME_SCALE
} from '~/types/frame'
import type {
  CameraBrand,
  CameraBrandId,
  FrameLogoColorMode,
  FrameLogoStyle,
  FrameSettings,
  FrameTypography,
  FrameWordmarkPreset
} from '~/types/frame'
import { CAMERA_BRANDS, getLogoMark } from '~/utils/cameraBrands'
import { getFrameFontFamily, getFrameFontWeight, isFrameFontItalic } from '~/utils/frameFonts'
import { loadFrameLogoUrl } from '~/utils/frameLogos'

const props = defineProps<{ brand: CameraBrand; customLogo?: FrameImageEntry }>()
const settings = defineModel<FrameSettings>({ required: true })
const emit = defineEmits<{
  brand: [id: CameraBrandId]
  'wordmark-preset': [preset: FrameWordmarkPreset]
  'custom-logo': [files: File[]]
  'remove-custom-logo': []
}>()
const { t } = useI18n()
const query = ref('')
const logoInputId = 'frame-custom-logo-input'
const markUrls = ref<Record<string, string>>({})

const brandLabel = (brand: CameraBrand) =>
  brand.id === 'custom' ? t('frame.brand.custom') : brand.name
const brands = computed(() => {
  const search = query.value.trim().toLowerCase()
  if (!search) return CAMERA_BRANDS
  return CAMERA_BRANDS.filter(
    (brand) => brandLabel(brand).toLowerCase().includes(search) || brand.id.includes(search)
  )
})

watch(
  () => props.brand,
  async (brand) => {
    if (import.meta.server) return
    const entries = await Promise.all(
      brand.marks.map(async (mark) => [mark.id, await loadFrameLogoUrl(mark.id)] as const)
    )
    const loaded = Object.fromEntries(
      entries.filter((entry): entry is [string, string] => !!entry[1])
    )
    markUrls.value = { ...markUrls.value, ...loaded }
  },
  { immediate: true }
)

interface StyleOption {
  key: string
  style: FrameLogoStyle
  mark?: string
  label: string
}

const styleOptions = computed<StyleOption[]>(() => [
  ...props.brand.marks.map((mark, index) => ({
    key: `mark:${mark.id}`,
    style: 'mark' as const,
    mark: mark.id,
    label: t('frame.brand.markOption', { number: index + 1 })
  })),
  { key: 'wordmark', style: 'wordmark', label: t('frame.brand.wordmark') },
  { key: 'custom', style: 'custom', label: t('frame.brand.customImage') },
  { key: 'none', style: 'none', label: t('frame.brand.none') }
])

const isActive = (option: StyleOption) =>
  settings.value.logo.style === option.style &&
  (option.style !== 'mark' || settings.value.logo.mark === option.mark)

const pickLogo = () => document.getElementById(logoInputId)?.click()

const chooseStyle = (option: StyleOption) => {
  settings.value.logo.style = option.style
  if (option.mark) settings.value.logo.mark = option.mark
  if (option.style === 'custom' && !props.customLogo) pickLogo()
}

const typographyStyle = (typography: Omit<FrameTypography, 'uppercase'>) => ({
  fontFamily: getFrameFontFamily(typography.font),
  fontWeight: getFrameFontWeight(typography),
  fontStyle: isFrameFontItalic(typography) ? 'italic' : 'normal',
  letterSpacing: `${typography.letterSpacing}em`
})

const wordmarkPreview = computed(() => {
  const text = settings.value.logo.wordmark.trim() || brandLabel(props.brand) || 'Aa'
  return settings.value.logo.typography.uppercase ? text.toUpperCase() : text
})

const presets = Object.keys(FRAME_WORDMARK_PRESETS) as FrameWordmarkPreset[]

const tintable = computed(() => {
  const { style, mark } = settings.value.logo
  if (style === 'mark') return getLogoMark(mark)?.tintable ?? false
  return style === 'custom' || style === 'wordmark'
})

// Wordmarks are text, so their "original" colour is the caption colour.
const colorOptions = computed<Array<{ value: FrameLogoColorMode; label: string }>>(() =>
  settings.value.logo.style === 'wordmark'
    ? [
        { value: 'original', label: t('frame.brand.colorText') },
        { value: 'custom', label: t('frame.brand.colorCustom') }
      ]
    : [
        { value: 'original', label: t('frame.brand.colorOriginal') },
        { value: 'text', label: t('frame.brand.colorText') },
        { value: 'custom', label: t('frame.brand.colorCustom') }
      ]
)
const colorMode = computed({
  get: () =>
    settings.value.logo.style === 'wordmark' && settings.value.logo.colorMode === 'text'
      ? 'original'
      : settings.value.logo.colorMode,
  set: (value: FrameLogoColorMode) => {
    settings.value.logo.colorMode = value
  }
})
</script>

<template>
  <div class="space-y-4 border-b border-border p-5">
    <p class="text-xs font-medium">{{ t('frame.brand.heading') }}</p>

    <div>
      <label class="flex items-center gap-2 rounded-md border border-border bg-card px-2.5">
        <Search class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span class="sr-only">{{ t('frame.brand.search') }}</span>
        <input
          v-model="query"
          class="min-w-0 flex-1 bg-transparent py-2 text-xs outline-none placeholder:text-muted-foreground/60"
          type="search"
          autocomplete="off"
          spellcheck="false"
          :aria-label="t('frame.brand.search')"
          :placeholder="t('frame.brand.searchPlaceholder')"
        />
      </label>
      <div
        class="mt-2 grid max-h-40 grid-cols-3 gap-1 overflow-y-auto overscroll-contain"
        role="group"
        :aria-label="t('frame.brand.list')"
      >
        <button
          v-for="item in brands"
          :key="item.id"
          type="button"
          class="truncate rounded-md border px-2 py-1.5 text-[11px] transition"
          :class="
            settings.logo.brand === item.id
              ? 'border-primary bg-accent font-medium text-accent-foreground'
              : 'border-transparent text-muted-foreground hover:border-border hover:bg-accent/60 hover:text-foreground'
          "
          :aria-pressed="settings.logo.brand === item.id"
          :title="brandLabel(item)"
          @click="emit('brand', item.id)"
        >
          {{ brandLabel(item) }}
        </button>
        <p
          v-if="!brands.length"
          class="col-span-3 py-3 text-center text-[10px] text-muted-foreground"
        >
          {{ t('frame.brand.empty') }}
        </p>
      </div>
    </div>

    <div>
      <p class="mb-2 text-[10px] text-muted-foreground">{{ t('frame.brand.logoStyle') }}</p>
      <div class="grid grid-cols-2 gap-2" role="group" :aria-label="t('frame.brand.logoStyle')">
        <button
          v-for="option in styleOptions"
          :key="option.key"
          type="button"
          class="flex min-w-0 flex-col items-stretch gap-1.5 rounded-lg border p-1.5 text-[10px] transition"
          :class="
            isActive(option)
              ? 'border-primary ring-1 ring-primary'
              : 'border-border hover:border-primary/50'
          "
          :aria-pressed="isActive(option)"
          :aria-label="option.label"
          @click="chooseStyle(option)"
        >
          <span
            class="grid h-11 place-items-center overflow-hidden rounded-md border border-black/5 px-2"
            :style="{ backgroundColor: settings.frameColor, color: settings.textColor }"
          >
            <img
              v-if="option.mark && markUrls[option.mark]"
              :src="markUrls[option.mark]"
              alt=""
              class="max-h-7 max-w-full object-contain"
            />
            <span
              v-else-if="option.style === 'wordmark'"
              class="max-w-full truncate text-sm"
              :style="typographyStyle(settings.logo.typography)"
            >
              {{ wordmarkPreview }}
            </span>
            <ImagePlus
              v-else-if="option.style === 'custom'"
              class="size-4 opacity-60"
              aria-hidden="true"
            />
            <Ban v-else-if="option.style === 'none'" class="size-4 opacity-40" aria-hidden="true" />
          </span>
          <span class="truncate text-muted-foreground">{{ option.label }}</span>
        </button>
      </div>
    </div>

    <div v-if="settings.logo.style === 'wordmark'" class="space-y-3">
      <input
        v-model="settings.logo.wordmark"
        class="w-full rounded-md border border-border bg-card px-3 py-2 text-xs outline-none transition placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        type="text"
        :maxlength="MAX_FRAME_TEXT_LENGTH"
        autocomplete="off"
        spellcheck="false"
        :aria-label="t('frame.brand.wordmarkText')"
        :placeholder="t('frame.brand.wordmarkPlaceholder')"
      />
      <div>
        <p class="mb-2 text-[10px] text-muted-foreground">{{ t('frame.brand.presets.heading') }}</p>
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="preset in presets"
            :key="preset"
            type="button"
            class="flex flex-col items-center gap-1 rounded-md border border-border px-1 py-1.5 text-muted-foreground transition hover:border-primary/50 hover:bg-accent/60"
            :title="t(`frame.brand.presets.${preset}`)"
            @click="emit('wordmark-preset', preset)"
          >
            <span
              class="text-[15px] leading-none text-foreground"
              :style="typographyStyle(FRAME_WORDMARK_PRESETS[preset])"
            >
              Ab
            </span>
            <span class="max-w-full truncate text-[9px]">{{
              t(`frame.brand.presets.${preset}`)
            }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Always rendered so choosing the custom tile can open the picker in the same gesture. -->
    <FilmImageFileInput
      :id="logoInputId"
      input-class="hidden"
      @files="emit('custom-logo', $event)"
    />
    <div v-if="settings.logo.style === 'custom'" class="space-y-2">
      <div class="flex items-center gap-2 rounded-md border border-border bg-card p-1.5 pl-3">
        <label
          :for="logoInputId"
          role="button"
          tabindex="0"
          class="min-w-0 flex-1 cursor-pointer truncate text-[11px]"
          @keydown.enter.prevent="pickLogo"
          @keydown.space.prevent="pickLogo"
        >
          {{ customLogo?.name || t('frame.brand.customUpload') }}
        </label>
        <button
          v-if="customLogo"
          type="button"
          class="grid size-7 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          :aria-label="t('frame.brand.customRemove')"
          :title="t('frame.brand.customRemove')"
          @click="emit('remove-custom-logo')"
        >
          <X class="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <p class="text-[10px] leading-relaxed text-muted-foreground">
        {{ t('frame.brand.customHint') }}
      </p>
    </div>

    <template v-if="settings.logo.style !== 'none'">
      <div v-if="tintable" class="space-y-2">
        <p class="text-[10px] text-muted-foreground">{{ t('frame.brand.color') }}</p>
        <FilmFrameSegmented
          v-model="colorMode"
          :options="colorOptions"
          :label="t('frame.brand.color')"
        />
        <FilmColorField
          v-if="settings.logo.colorMode === 'custom'"
          v-model="settings.logo.color"
          :picker-label="t('frame.brand.colorPicker')"
          :hex-label="t('frame.brand.colorHex')"
          placeholder="#1C1C1C"
        />
      </div>
      <p v-else class="text-[10px] leading-relaxed text-muted-foreground">
        {{ t('frame.brand.multicolorHint') }}
      </p>
      <FilmFrameRangeField
        v-model="settings.logo.scale"
        :label="t('frame.brand.size')"
        :input-label="t('frame.brand.sizeInput')"
        :min="MIN_FRAME_SCALE * 100"
        :max="MAX_FRAME_SCALE * 100"
        :step="5"
      />
    </template>
  </div>
</template>
