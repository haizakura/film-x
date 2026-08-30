<script setup lang="ts">
import type { ExportFormat } from '~/types/image'

defineProps<{
  format: ExportFormat
  quality: number
  completedCount: number
  totalCount: number
  exporting: boolean
  exportProgress: number
  exportLabel: string
}>()

const emit = defineEmits<{
  'update:format': [format: ExportFormat]
  'update:quality': [quality: number]
  'export-all': []
  'export-current': []
}>()

const formats: ExportFormat[] = ['jpeg', 'png', 'webp', 'tiff']
</script>

<template>
  <div class="border-b border-film-900/10 px-5 py-5">
    <div class="flex items-center justify-between">
      <p class="eyebrow">输出</p>
      <span v-if="completedCount" class="font-mono text-[9px] text-emerald-700">
        {{ completedCount }}/{{ totalCount }} DONE
      </span>
    </div>
    <FilmOutputFormatSelector
      class="mt-4"
      :model-value="format"
      :formats="formats"
      @update:model-value="emit('update:format', $event)"
    />

    <label v-if="format === 'jpeg' || format === 'webp'" class="mt-5 block">
      <span class="mb-3 flex items-center justify-between text-xs">
        <span class="font-medium">输出质量</span>
        <output class="font-mono text-[10px] text-film-500"
          >{{ Math.round(quality * 100) }}%</output
        >
      </span>
      <input
        :value="quality"
        class="range"
        type="range"
        min="0.7"
        max="1"
        step="0.01"
        @input="emit('update:quality', Number(($event.target as HTMLInputElement).value))"
      />
    </label>
    <p v-else class="mt-4 text-[11px] leading-5 text-film-500">
      <template v-if="format === 'tiff'">
        TIF 使用未压缩 RGBA 像素输出，避免再次有损编码，文件体积会很大。
      </template>
      <template v-else>PNG 无损输出，文件体积会明显大于 JPEG。</template>
    </p>
  </div>

  <slot name="actions" />

  <div class="sticky bottom-0 border-t border-film-900/10 bg-film-50/95 p-5 backdrop-blur">
    <div v-if="exporting" class="mb-4">
      <div class="mb-2 flex justify-between gap-3 text-[10px] text-film-500">
        <span class="truncate">{{ exportLabel }}</span>
        <span class="font-mono">{{ exportProgress }}%</span>
      </div>
      <UProgress :model-value="exportProgress" size="xs" />
    </div>
    <UButton
      block
      class="export-button"
      color="neutral"
      variant="solid"
      size="lg"
      icon="i-lucide-package-open"
      :loading="exporting"
      :label="totalCount > 1 ? `切分全部 ${totalCount} 张` : '切分并下载'"
      @click="emit('export-all')"
    />
    <UButton
      v-if="totalCount > 1"
      block
      class="current-export-button mt-2"
      color="neutral"
      variant="outline"
      size="sm"
      :disabled="exporting"
      label="仅导出当前图像"
      @click="emit('export-current')"
    />
  </div>
</template>

<style scoped>
.export-button {
  border: 1px solid var(--color-film-900) !important;
  color: var(--color-film-100) !important;
  background: var(--color-film-900) !important;
  box-shadow: 0 8px 22px rgb(29 24 18 / 18%);
}

.export-button:hover {
  background: var(--color-film-700) !important;
}

.export-button:focus-visible {
  outline: 3px solid rgb(245 158 11 / 35%);
  outline-offset: 2px;
}

.current-export-button {
  border-color: var(--color-film-300) !important;
  color: var(--color-film-800) !important;
  background: var(--color-film-100) !important;
}

.current-export-button:hover:not(:disabled) {
  border-color: var(--color-film-500) !important;
  background: var(--color-film-200) !important;
}

.current-export-button:focus-visible {
  outline: 3px solid rgb(120 97 67 / 25%);
  outline-offset: 2px;
}
</style>
