<script setup lang="ts">
import { Download, LoaderCircle } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { MAX_FRAME_CANVAS_SIDE, MIN_FRAME_OUTPUT_SIDE } from '~/types/frame'
import type { FrameOutputFormat, FrameOutputSizeMode, FrameSettings } from '~/types/frame'
import { MAX_EXPORT_QUALITY, MIN_EXPORT_QUALITY } from '~/types/image'
import type { ExportFormat } from '~/types/image'
import { clampFrameOutputSide } from '~/utils/photoFrame'

defineProps<{
  hasPhoto: boolean
  outputSize?: { width: number; height: number }
  exporting: boolean
}>()
const settings = defineModel<FrameSettings>({ required: true })
const emit = defineEmits<{ download: [] }>()
const { t } = useI18n()
const formats: ExportFormat[] = ['jpeg', 'png', 'webp']

const sizeOptions = computed<Array<{ value: FrameOutputSizeMode; label: string }>>(() => [
  { value: 'original', label: t('frame.export.original') },
  { value: 'custom', label: t('frame.export.custom') }
])

// Committed on change so partial input such as "3" is not clamped while typing.
const commitLongSide = (event: Event) => {
  const input = event.target as HTMLInputElement
  const value = clampFrameOutputSide(input.valueAsNumber)
  if (value !== undefined) settings.value.outputLongSide = value
  // Show the clamped value even when the model did not change.
  input.value = String(settings.value.outputLongSide)
}

const updateFormat = (format: ExportFormat) => {
  settings.value.outputFormat = format as FrameOutputFormat
}
</script>

<template>
  <div class="sticky bottom-0 space-y-3 bg-background/95 p-5 backdrop-blur">
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
        <span>{{ t('frame.export.size') }}</span>
        <span v-if="outputSize" class="font-mono">
          {{ t('frame.export.dimensions', outputSize) }}
        </span>
      </div>
      <FilmSegmented
        v-model="settings.outputSizeMode"
        :options="sizeOptions"
        :label="t('frame.export.size')"
      />
      <div
        v-if="settings.outputSizeMode === 'custom'"
        class="flex items-center justify-between gap-3 text-[10px] text-muted-foreground"
      >
        <span>
          {{
            t('frame.export.customHint', { min: MIN_FRAME_OUTPUT_SIDE, max: MAX_FRAME_CANVAS_SIDE })
          }}
        </span>
        <label
          class="flex shrink-0 items-center gap-1 rounded-md border border-border bg-card px-2"
        >
          <input
            :value="settings.outputLongSide"
            class="w-14 bg-transparent py-1.5 text-right font-mono text-[10px] text-foreground outline-none"
            type="number"
            :min="MIN_FRAME_OUTPUT_SIDE"
            :max="MAX_FRAME_CANVAS_SIDE"
            step="1"
            inputmode="numeric"
            :aria-label="t('frame.export.longSideInput')"
            @change="commitLongSide"
          />
          <span class="font-mono text-[9px] text-muted-foreground/70">px</span>
        </label>
      </div>
    </div>
    <FilmOutputFormatSelector
      :model-value="settings.outputFormat"
      :formats="formats"
      @update:model-value="updateFormat"
    />
    <FilmRangeField
      v-if="settings.outputFormat !== 'png'"
      v-model="settings.outputQuality"
      :label="t('export.quality')"
      :input-label="t('export.qualityInput')"
      :min="MIN_EXPORT_QUALITY * 100"
      :max="MAX_EXPORT_QUALITY * 100"
    />
    <Button
      class="w-full"
      size="lg"
      type="button"
      :disabled="!hasPhoto || exporting"
      @click="emit('download')"
    >
      <LoaderCircle v-if="exporting" class="size-4 animate-spin" aria-hidden="true" />
      <Download v-else class="size-4" aria-hidden="true" />
      {{ exporting ? t('frame.export.exporting') : t('frame.export.download') }}
    </Button>
  </div>
</template>
