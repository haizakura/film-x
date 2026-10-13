<script setup lang="ts">
import { Download, LoaderCircle } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { FrameOutputFormat, FrameOutputSize, FrameSettings } from '~/types/frame'
import type { ExportFormat } from '~/types/image'

defineProps<{
  hasPhoto: boolean
  outputSize?: { width: number; height: number }
  exporting: boolean
}>()
const settings = defineModel<FrameSettings>({ required: true })
const emit = defineEmits<{ download: [] }>()
const { t } = useI18n()
const formats: ExportFormat[] = ['jpeg', 'png']

const sizeOptions = computed<Array<{ value: FrameOutputSize; label: string }>>(() => [
  { value: 'original', label: t('frame.export.original') },
  { value: 4096, label: '4096' },
  { value: 3000, label: '3000' },
  { value: 2048, label: '2048' }
])

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
      <FilmFrameSegmented
        v-model="settings.outputSize"
        :options="sizeOptions"
        :label="t('frame.export.size')"
      />
    </div>
    <FilmOutputFormatSelector
      :model-value="settings.outputFormat"
      :formats="formats"
      @update:model-value="updateFormat"
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
