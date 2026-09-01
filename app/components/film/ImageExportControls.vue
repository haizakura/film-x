<script setup lang="ts">
import { Loader2, PackageOpen } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
      <span v-if="completedCount" class="font-mono text-[9px] text-success">
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
      <Progress :model-value="exportProgress" />
    </div>
    <Button
      type="button"
      class="w-full shadow-md shadow-primary/15"
      size="lg"
      :disabled="exporting"
      :aria-busy="exporting"
      @click="emit('export-all')"
    >
      <Loader2 v-if="exporting" class="animate-spin" />
      <PackageOpen v-else />
      {{ totalCount > 1 ? `切分全部 ${totalCount} 张` : '切分并下载' }}
    </Button>
    <Button
      v-if="totalCount > 1"
      type="button"
      class="mt-2 w-full"
      variant="outline"
      size="sm"
      :disabled="exporting"
      @click="emit('export-current')"
    >
      仅导出当前图像
    </Button>
  </div>
</template>
