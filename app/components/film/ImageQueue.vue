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

type PendingAction = { type: 'clear'; count: number } | { type: 'remove'; id: string; name: string }

const confirmationOpen = ref(false)
const pendingAction = ref<PendingAction>()

const confirmationTitle = computed(() =>
  pendingAction.value?.type === 'clear' ? '确认清空列表？' : '确认删除图像？'
)

const confirmationDescription = computed(() => {
  if (pendingAction.value?.type === 'clear') {
    return `将从本次扫描中移除全部 ${pendingAction.value.count} 张图像。此操作无法撤销。`
  }
  if (pendingAction.value?.type === 'remove') {
    return `将从本次扫描中移除“${pendingAction.value.name}”。此操作无法撤销。`
  }
  return ''
})

const confirmationLabel = computed(() =>
  pendingAction.value?.type === 'clear' ? '清空列表' : '删除图像'
)

const requestClear = () => {
  pendingAction.value = { type: 'clear', count: props.items.length }
  confirmationOpen.value = true
}

const requestRemove = (item: ImageQueueItem) => {
  pendingAction.value = { type: 'remove', id: item.id, name: item.name }
  confirmationOpen.value = true
}

const confirmPendingAction = () => {
  const action = pendingAction.value
  if (!action) return

  confirmationOpen.value = false
  if (action.type === 'clear') emit('clear')
  if (action.type === 'remove') emit('remove', action.id)
}

const resetPendingAction = () => {
  pendingAction.value = undefined
}

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
    class="queue-panel w-full min-w-0 overflow-hidden border-b border-film-900/10 bg-film-50/45 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:border-r lg:border-b-0"
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
      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="添加图像"
          @click="emit('add')"
        />
        <UButton
          class="lg:hidden"
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          aria-label="清空列表"
          @click="requestClear"
        />
      </div>
    </div>

    <div
      class="queue-list flex w-full min-w-0 max-w-full gap-2 overflow-x-auto p-3 lg:block lg:min-h-0 lg:flex-1 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain"
      tabindex="0"
      aria-label="图像列表，使用上、下方向键选择"
      @keydown.up.prevent="selectAdjacent(-1)"
      @keydown.down.prevent="selectAdjacent(1)"
    >
      <div
        v-for="(item, index) in items"
        :id="`queue-item-${item.id}`"
        :key="item.id"
        class="queue-item group mb-0 flex w-52 shrink-0 items-stretch rounded-lg border transition lg:mb-2 lg:w-full lg:min-w-0"
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
        <UButton
          class="my-auto mr-2 shrink-0 lg:invisible lg:group-hover:visible lg:focus:visible"
          icon="i-lucide-x"
          color="error"
          variant="ghost"
          size="xs"
          :aria-label="`移除图像 ${item.name}`"
          @click.stop="requestRemove(item)"
        />
      </div>
    </div>

    <UButton
      class="mx-3 mb-4 hidden self-start lg:mt-2 lg:inline-flex"
      color="error"
      variant="ghost"
      size="xs"
      @click="requestClear"
    >
      清空列表
    </UButton>

    <UModal
      v-model:open="confirmationOpen"
      :description="confirmationDescription"
      :close="false"
      :ui="{ content: 'sm:max-w-md', footer: 'justify-end' }"
      @after:leave="resetPendingAction"
    >
      <template #title>
        <span class="flex items-center gap-2 text-red-600">
          <UIcon name="i-lucide-triangle-alert" class="size-5" />
          {{ confirmationTitle }}
        </span>
      </template>

      <template #footer>
        <UButton color="neutral" variant="soft" @click="confirmationOpen = false"> 取消 </UButton>
        <UButton color="error" @click="confirmPendingAction">
          {{ confirmationLabel }}
        </UButton>
      </template>
    </UModal>
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
