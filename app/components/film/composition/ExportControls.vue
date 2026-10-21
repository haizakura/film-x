<script setup lang="ts">
import { Download } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { CompositionOutputFormat, CompositionSettings } from '~/types/composition'
import { MAX_EXPORT_QUALITY, MIN_EXPORT_QUALITY } from '~/types/image'
import type { ExportFormat } from '~/types/image'

defineProps<{ hasImages: boolean }>()
const { t } = useI18n()
const settings = defineModel<CompositionSettings>({ required: true })
const emit = defineEmits<{ download: [] }>()
const formats: ExportFormat[] = ['jpeg', 'png', 'webp']

const updateFormat = (format: ExportFormat) => {
  settings.value.outputFormat = format as CompositionOutputFormat
}
</script>

<template>
  <div class="sticky bottom-0 space-y-3 bg-background/95 p-5 backdrop-blur">
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
    <Button class="w-full" size="lg" type="button" :disabled="!hasImages" @click="emit('download')">
      <Download class="size-4" aria-hidden="true" />
      {{ t('composition.download') }}
    </Button>
  </div>
</template>
