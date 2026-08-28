<script setup lang="ts">
import type { ImageQueueItem } from '~/types/image'
import { formatBytes } from '~/utils/image'

const props = defineProps<{
  items: ImageQueueItem[]
  activeId?: string
  totalSize: number
}>()

const emit = defineEmits<{
  select: [id: string]
  add: []
  remove: [id: string]
  clear: []
}>()

const statusText = (item: ImageQueueItem) => {
  if (item.status === 'done') return '已完成'
  if (item.status === 'error') return '失败'
  if (item.status === 'processing') return '处理中'
  if (item.analysisStatus === 'pending') return '等待自动识别'
  if (item.analysisStatus === 'analyzing') return '正在识别中线'
  if (item.analysisStatus === 'done') return `已识别 · ${formatBytes(item.size)}`
  return formatBytes(item.size)
}

const selectAdjacent = (direction: -1 | 1) => {
  if (!props.items.length) return

  const activeIndex = props.items.findIndex((item) => item.id === props.activeId)
  const startIndex = activeIndex === -1 ? (direction === 1 ? -1 : props.items.length) : activeIndex
  const nextIndex = Math.max(0, Math.min(props.items.length - 1, startIndex + direction))
  const nextItem = props.items[nextIndex]

  if (!nextItem) return
  emit('select', nextItem.id)
  nextTick(() => {
    document.getElementById(`queue-item-${nextItem.id}`)?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest'
    })
  })
}
</script>

<template>
  <aside
    class="queue-panel border-b border-film-900/10 bg-film-50/45 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden lg:border-r lg:border-b-0"
  >
    <div
      class="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-film-900/10 bg-film-50/90 px-4 py-4 backdrop-blur"
    >
      <div>
        <p class="text-sm font-semibold">本次扫描</p>
        <p class="mt-0.5 font-mono text-[10px] text-film-500">
          {{ items.length }} FILES · {{ formatBytes(totalSize) }}
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="添加图像"
        @click="emit('add')"
      />
    </div>

    <div
      class="queue-list flex gap-2 overflow-x-auto p-3 lg:block lg:min-h-0 lg:flex-1 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain"
      tabindex="0"
      aria-label="图像列表，使用上、下方向键选择"
      @keydown.up.prevent="selectAdjacent(-1)"
      @keydown.down.prevent="selectAdjacent(1)"
    >
      <div
        v-for="(item, index) in items"
        :id="`queue-item-${item.id}`"
        :key="item.id"
        class="queue-item group mb-0 flex min-w-52 items-stretch rounded-lg border transition lg:mb-2 lg:w-full lg:min-w-0"
        :class="
          activeId === item.id
            ? 'border-film-800 bg-film-100 shadow-sm'
            : 'border-transparent hover:bg-film-100/60'
        "
      >
        <button
          type="button"
          class="flex min-w-0 flex-1 items-start gap-3 p-3 text-left"
          @click="emit('select', item.id)"
        >
          <span class="mt-0.5 font-mono text-[10px] text-film-400">{{
            String(index + 1).padStart(2, '0')
          }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs font-medium">{{ item.name }}</span>
            <span
              class="mt-1 flex items-center gap-1.5 font-mono text-[9px] tracking-wide text-film-500 uppercase"
            >
              <span
                class="size-1.5 rounded-full"
                :class="{
                  'bg-film-300':
                    item.status === 'ready' &&
                    (item.analysisStatus === 'pending' || item.analysisStatus === 'failed'),
                  'animate-pulse bg-amber-500':
                    item.status === 'processing' || item.analysisStatus === 'analyzing',
                  'bg-emerald-500':
                    item.status === 'done' ||
                    (item.status === 'ready' && item.analysisStatus === 'done'),
                  'bg-red-500': item.status === 'error'
                }"
              />
              {{ statusText(item) }}
            </span>
          </span>
        </button>
        <button
          type="button"
          class="invisible my-auto mr-2 grid size-7 shrink-0 place-items-center rounded text-film-400 hover:bg-film-100 hover:text-film-800 focus:visible group-hover:visible"
          aria-label="移除图像"
          @click="emit('remove', item.id)"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
      </div>
    </div>

    <button
      class="mx-4 mb-5 shrink-0 text-left text-xs text-film-400 underline-offset-4 hover:text-film-700 hover:underline lg:mt-3"
      @click="emit('clear')"
    >
      清空列表
    </button>
  </aside>
</template>

<style scoped>
@media (max-width: 1023px) {
  .queue-panel {
    position: sticky;
    z-index: 20;
    top: 0;
  }
}
</style>
