<script setup lang="ts">
import { CopyCheck } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { AnalysisStatus, ExportFormat, SplitSettings } from '~/types/image'

defineProps<{
  settings: SplitSettings
  analysisStatus: AnalysisStatus
  format: ExportFormat
  quality: number
  completedCount: number
  totalCount: number
  exporting: boolean
  exportProgress: number
  exportLabel: string
}>()
const { t } = useI18n()

const emit = defineEmits<{
  'update:settings': [settings: SplitSettings]
  'update:format': [format: ExportFormat]
  'update:quality': [quality: number]
  'apply-all': []
  reset: []
  detect: []
  'export-all': []
  'export-current': []
}>()

const tabs = computed(() => [
  { value: 'split', label: t('split.heading') },
  { value: 'rotation', label: t('rotation.heading') },
  { value: 'export', label: t('toolPanel.export') }
])
</script>

<template>
  <FilmToolPanel
    class="border-t border-border bg-background/55 lg:border-t-0 lg:border-l"
    :tabs="tabs"
  >
    <template #split>
      <FilmImageSplitControls
        :settings="settings"
        :analysis-status="analysisStatus"
        @update:settings="emit('update:settings', $event)"
        @detect="emit('detect')"
      />
    </template>
    <template #rotation>
      <FilmImageRotationControls
        :settings="settings"
        @update:settings="emit('update:settings', $event)"
      />
    </template>
    <template #export>
      <FilmImageExportControls
        :format="format"
        :quality="quality"
        :completed-count="completedCount"
        :total-count="totalCount"
        :exporting="exporting"
        :export-progress="exportProgress"
        :export-label="exportLabel"
        @update:format="emit('update:format', $event)"
        @update:quality="emit('update:quality', $event)"
        @export-all="emit('export-all')"
        @export-current="emit('export-current')"
      >
        <template #actions>
          <div class="space-y-2 p-5">
            <Button type="button" class="w-full" variant="outline" @click="emit('apply-all')">
              <CopyCheck />
              {{ t('export.applyAll') }}
            </Button>
            <button
              type="button"
              class="mx-auto block py-1 text-[11px] text-muted-foreground/70 hover:text-foreground"
              @click="emit('reset')"
            >
              {{ t('export.reset') }}
            </button>
          </div>
        </template>
      </FilmImageExportControls>
    </template>
  </FilmToolPanel>
</template>
