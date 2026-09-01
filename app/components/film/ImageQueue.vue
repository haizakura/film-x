<script setup lang="ts">
import { Plus, Trash2, TriangleAlert, X } from '@lucide/vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
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

watch(confirmationOpen, (open) => {
  if (!open) resetPendingAction()
})

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
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="添加图像"
          @click="emit('add')"
        >
          <Plus />
        </Button>
        <Button
          type="button"
          class="text-destructive hover:bg-destructive/10 hover:text-destructive lg:hidden"
          variant="ghost"
          size="icon-sm"
          aria-label="清空列表"
          @click="requestClear"
        >
          <Trash2 />
        </Button>
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
            ? 'border-primary bg-accent/55 shadow-sm'
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
                  'animate-pulse bg-warning':
                    item.status === 'processing' || item.analysisStatus === 'analyzing',
                  'bg-success':
                    item.status === 'done' ||
                    (item.status === 'ready' && item.analysisStatus === 'done'),
                  'bg-destructive': item.status === 'error'
                }"
              />
              {{ statusText(item) }}
            </span>
          </span>
        </button>
        <Button
          type="button"
          class="my-auto mr-2 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive lg:invisible lg:group-hover:visible lg:focus:visible"
          variant="ghost"
          size="icon-xs"
          :aria-label="`移除图像 ${item.name}`"
          @click.stop="requestRemove(item)"
        >
          <X />
        </Button>
      </div>
    </div>

    <Button
      type="button"
      class="mx-3 mb-4 hidden self-start text-destructive hover:bg-destructive/10 hover:text-destructive lg:mt-2 lg:inline-flex"
      variant="ghost"
      size="xs"
      @click="requestClear"
    >
      清空列表
    </Button>

    <AlertDialog v-model:open="confirmationOpen">
      <AlertDialogContent class="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2 text-destructive">
            <TriangleAlert class="size-5" />
            {{ confirmationTitle }}
          </AlertDialogTitle>
          <AlertDialogDescription>{{ confirmationDescription }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmPendingAction"
          >
            {{ confirmationLabel }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
