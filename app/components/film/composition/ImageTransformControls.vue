<script setup lang="ts">
import { RotateCcw } from '@lucide/vue'
import type { CompositionImage } from '~/types/composition'

const props = defineProps<{
  enabled: boolean
  images: Array<CompositionImage | undefined>
}>()
const emit = defineEmits<{
  scale: [payload: { index: number; value: number }]
  reset: [index: number]
}>()
const { t } = useI18n()

const selectedIndex = ref(0)
const selectedImage = computed(() => props.images[selectedIndex.value])
const canAdjust = computed(() => props.enabled && Boolean(selectedImage.value))

watch(
  () => props.images,
  () => {
    if (props.images[selectedIndex.value]) return
    selectedIndex.value = props.images.findIndex(Boolean)
    if (selectedIndex.value < 0) selectedIndex.value = 0
  },
  { immediate: true }
)

const selectImage = (index: number) => {
  if (props.images[index]) selectedIndex.value = index
}

const updateScale = (event: Event) => {
  if (!selectedImage.value) return
  const rawValue = (event.target as HTMLInputElement).value
  if (!rawValue) return
  const value = Number(rawValue)
  if (!Number.isFinite(value)) return
  emit('scale', { index: selectedIndex.value, value: Math.min(3, Math.max(0.5, value)) })
}
</script>

<template>
  <div class="border-b border-border p-5" :class="{ 'opacity-60': !enabled }">
    <div class="flex items-center justify-between gap-3">
      <p class="eyebrow">{{ t('composition.transform.heading') }}</p>
      <button
        class="inline-flex items-center gap-1 text-[10px] text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        :disabled="!canAdjust"
        :aria-label="t('composition.transform.reset')"
        @click="emit('reset', selectedIndex)"
      >
        <RotateCcw class="size-3" aria-hidden="true" />
        {{ t('composition.transform.reset') }}
      </button>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      <button
        v-for="(_, index) in images"
        :key="index"
        class="rounded-md py-2 text-[10px] transition disabled:cursor-not-allowed disabled:opacity-40"
        :class="
          selectedIndex === index
            ? 'bg-primary font-medium text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        "
        type="button"
        :disabled="!images[index]"
        @click="selectImage(index)"
      >
        {{ t('composition.transform.frame', { number: `0${index + 1}` }) }}
      </button>
    </div>

    <div class="mt-4">
      <div class="mb-2 flex items-center justify-between gap-2 text-xs">
        <span>{{ t('composition.transform.scale') }}</span>
        <label
          class="flex shrink-0 items-center gap-1 rounded-md border border-border bg-card px-1.5"
        >
          <span class="sr-only">{{ t('composition.transform.scaleInput') }}</span>
          <input
            class="w-11 bg-transparent py-1 text-right font-mono text-[10px] outline-none"
            type="number"
            min="0.5"
            max="3"
            step="0.01"
            inputmode="decimal"
            :value="(selectedImage?.transform.scale ?? 1).toFixed(2)"
            :disabled="!canAdjust"
            :aria-label="t('composition.transform.scaleInput')"
            @change="updateScale"
          />
          <span class="font-mono text-[9px] text-muted-foreground/70">×</span>
        </label>
      </div>
      <input
        class="range w-full"
        type="range"
        min="0.5"
        max="3"
        step="0.01"
        :value="selectedImage?.transform.scale ?? 1"
        :disabled="!canAdjust"
        :aria-label="t('composition.transform.scale')"
        @input="updateScale"
      />
    </div>

    <p v-if="!enabled" class="mt-3 text-[10px] leading-relaxed text-muted-foreground">
      {{ t('composition.transform.autoHint') }}
    </p>
  </div>
</template>
