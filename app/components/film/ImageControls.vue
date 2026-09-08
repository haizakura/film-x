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
</script>

<template>
  <aside
    class="controls-panel border-t border-border bg-background/55 lg:overflow-y-auto lg:border-t-0 lg:border-l"
  >
    <FilmImageSplitControls
      :settings="settings"
      :analysis-status="analysisStatus"
      @update:settings="emit('update:settings', $event)"
      @detect="emit('detect')"
    />

    <FilmImageRotationControls
      :settings="settings"
      @update:settings="emit('update:settings', $event)"
    />

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
            class="mx-auto block py-1 text-[11px] text-muted-foreground/70 hover:text-foreground"
            @click="emit('reset')"
          >
            {{ t('export.reset') }}
          </button>
        </div>
      </template>
    </FilmImageExportControls>
  </aside>
</template>

<style scoped>
@media (max-width: 1023px) {
  .controls-panel {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .controls-panel > :last-child {
    position: static;
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .controls-panel {
    display: block;
  }
}
</style>
