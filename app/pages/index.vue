<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { ImageQueueItem, SplitSettings } from '~/types/image'
import { baseName } from '~/utils/image'

const FILE_INPUT_ID = 'scan-file-input'

useSeoMeta({
  title: '半格胶片切分',
  description: '自动识别半格胶片扫描中缝，在浏览器本地完成切分、旋转与批量导出。'
})

const {
  queue,
  activeId,
  activeItem,
  totalSize,
  completedCount,
  addFiles,
  removeItem,
  clearQueue,
  updateActiveSettings,
  applySettingsToAll,
  resetActiveSettings
} = useImageQueue()

const { analyzeDecodedItem, analyzeItems } = useAutoSplitDetection()

const { decoded, isLoading } = useImagePreview(activeItem, {
  onError: (item, message) => {
    item.analysisStatus = 'failed'
    toast.error(`无法读取 ${item.name}`, { description: message })
  },
  onDecoded: (item, image) => {
    if (item.analysisStatus === 'pending') analyzeDecodedItem(item, image)
  }
})

const {
  format,
  quality,
  exporting,
  progress: exportProgress,
  progressLabel: exportLabel,
  exportItems
} = useImageExport()

const pickFiles = () => document.getElementById(FILE_INPUT_ID)?.click()

const acceptFiles = (files: File[]) => {
  const { addedItems, rejectedCount } = addFiles(files)
  const backgroundItems = addedItems.filter((item) => item.id !== activeId.value)
  void analyzeItems(backgroundItems)
  if (rejectedCount) {
    toast.warning(`已忽略 ${rejectedCount} 个不支持的文件`, {
      description: '支持 TIFF、JPEG、PNG 与 WebP。'
    })
  }
}

const { isDragging, handleDragEnter, handleDragOver, handleDragLeave, handleDrop } =
  useImageDrop(acceptFiles)

const updateCenter = (center: number) => {
  if (activeItem.value) updateActiveSettings({ ...activeItem.value.settings, center })
}

const applyCurrentSettingsToAll = () => {
  if (!activeItem.value) return
  applySettingsToAll(activeItem.value.settings)
  toast.success('已应用到全部图像')
}

const waitForActivePreview = (items: ImageQueueItem[]) => {
  if (!isLoading.value || !activeItem.value || !items.includes(activeItem.value)) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    const stop = watch(isLoading, (loading) => {
      if (!loading) {
        stop()
        resolve()
      }
    })
  })
}

const runExport = async (items: ImageQueueItem[], archiveName: string) => {
  try {
    await waitForActivePreview(items)
    await analyzeItems([])
    const result = await exportItems(items, archiveName)
    if (!result) return

    const title = result.failedCount ? `导出完成，${result.failedCount} 个文件失败` : '切分完成'
    const options = { description: `已生成 ${result.generatedCount} 张图像。` }
    if (result.failedCount) toast.warning(title, options)
    else toast.success(title, options)
  } catch (error) {
    toast.error('导出失败', {
      description: error instanceof Error ? error.message : '无法生成压缩包'
    })
  }
}

const exportAll = () => runExport(queue.value, `full2half-${new Date().toISOString().slice(0, 10)}`)

const exportCurrent = () => {
  if (activeItem.value) runExport([activeItem.value], baseName(activeItem.value.name))
}

const updateSettings = (settings: SplitSettings) => updateActiveSettings(settings)

const detectActiveImage = () => {
  if (!activeItem.value) return
  if (decoded.value && !isLoading.value) {
    analyzeDecodedItem(activeItem.value, decoded.value, true)
    return
  }
  void analyzeItems([activeItem.value], true)
}
</script>

<template>
  <div
    class="flex flex-col lg:h-full lg:min-h-0 lg:overflow-hidden"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <FilmImageFileInput :id="FILE_INPUT_ID" multiple @files="acceptFiles" />

    <FilmUploadEmptyState
      v-if="!queue.length"
      class="w-full flex-1"
      :file-input-id="FILE_INPUT_ID"
      :is-dragging="isDragging"
      @pick="pickFiles"
    />

    <main
      v-else
      class="mx-auto grid w-full min-w-0 max-w-420 grid-cols-[minmax(0,1fr)] flex-1 lg:min-h-0 lg:grid-cols-[260px_minmax(0,1fr)_300px] lg:overflow-hidden"
    >
      <FilmImageQueue
        :items="queue"
        :active-id="activeId"
        :total-size="totalSize"
        @select="activeId = $event"
        @add="pickFiles"
        @remove="removeItem"
        @clear="clearQueue"
      />

      <FilmImagePreview
        :name="activeItem?.name"
        :error="activeItem?.error"
        :settings="activeItem?.settings"
        :decoded="decoded"
        :loading="isLoading"
        @update:center="updateCenter"
      />

      <FilmImageControls
        v-if="activeItem"
        :settings="activeItem.settings"
        :analysis-status="activeItem.analysisStatus"
        :format="format"
        :quality="quality"
        :completed-count="completedCount"
        :total-count="queue.length"
        :exporting="exporting"
        :export-progress="exportProgress"
        :export-label="exportLabel"
        @update:settings="updateSettings"
        @update:format="format = $event"
        @update:quality="quality = $event"
        @apply-all="applyCurrentSettingsToAll"
        @reset="resetActiveSettings"
        @detect="detectActiveImage"
        @export-all="exportAll"
        @export-current="exportCurrent"
      />
    </main>

    <FilmDropOverlay v-if="isDragging" />
  </div>
</template>
