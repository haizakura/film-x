<script setup lang="ts">
import { Download } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { CompositionOutputFormat, CompositionSettings } from '~/types/composition'
import type { ExportFormat } from '~/types/image'

defineProps<{ hasImages: boolean }>()
const settings = defineModel<CompositionSettings>({ required: true })
const emit = defineEmits<{ download: [] }>()
const formats: ExportFormat[] = ['jpeg', 'png']

const updateFormat = (format: ExportFormat) => {
  settings.value.outputFormat = format as CompositionOutputFormat
}
</script>

<template>
  <div class="sticky bottom-0 space-y-3 bg-film-50/95 p-5 backdrop-blur">
    <FilmOutputFormatSelector
      :model-value="settings.outputFormat"
      :formats="formats"
      @update:model-value="updateFormat"
    />
    <Button class="w-full" size="lg" type="button" :disabled="!hasImages" @click="emit('download')">
      <Download class="size-4" aria-hidden="true" />
      生成并下载
    </Button>
  </div>
</template>
