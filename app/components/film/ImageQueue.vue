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
const { t } = useI18n()

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
  pendingAction.value?.type === 'clear'
    ? t('queue.confirmClearTitle')
    : t('queue.confirmRemoveTitle')
)

const confirmationDescription = computed(() => {
  if (pendingAction.value?.type === 'clear') {
    return t('queue.confirmClearDescription', { count: pendingAction.value.count })
  }
  if (pendingAction.value?.type === 'remove') {
    return t('queue.confirmRemoveDescription', { name: pendingAction.value.name })
  }
  return ''
})

const confirmationLabel = computed(() =>
  pendingAction.value?.type === 'clear' ? t('queue.clear') : t('queue.delete')
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
  if (item.status === 'done') return t('queue.status.done')
  if (item.status === 'error') return t('queue.status.error')
  if (item.status === 'processing') return t('queue.status.processing')
  if (item.analysisStatus === 'pending') return t('queue.status.pending')
  if (item.analysisStatus === 'analyzing') return t('queue.status.analyzing')
  if (item.analysisStatus === 'done') {
    return t('queue.status.analyzed', { size: formatBytes(item.size) })
  }
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
    class="w-full min-w-0 overflow-hidden border-b border-border bg-background/45 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:border-r lg:border-b-0"
  >
    <div
      class="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 py-1 backdrop-blur lg:py-4"
    >
      <div>
        <p class="hidden text-sm font-semibold lg:block">{{ t('queue.title') }}</p>
        <p class="font-mono text-[10px] text-muted-foreground lg:mt-0.5">
          {{ t('queue.summary', { count: items.length, size: formatBytes(totalSize) }) }}
        </p>
      </div>
      <div class="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          :aria-label="t('queue.add')"
          @click="emit('add')"
        >
          <Plus />
        </Button>
        <Button
          type="button"
          class="text-destructive hover:bg-destructive/10 hover:text-destructive lg:hidden"
          variant="ghost"
          size="icon-sm"
          :aria-label="t('queue.clear')"
          @click="requestClear"
        >
          <Trash2 />
        </Button>
      </div>
    </div>

    <div
      class="queue-list flex w-full min-w-0 max-w-full gap-2 overflow-x-auto p-2 lg:block lg:p-3 lg:min-h-0 lg:flex-1 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain"
      tabindex="0"
      :aria-label="t('queue.listLabel')"
      @keydown.up.prevent="selectAdjacent(-1)"
      @keydown.down.prevent="selectAdjacent(1)"
    >
      <div
        v-for="(item, index) in items"
        :id="`queue-item-${item.id}`"
        :key="item.id"
        class="queue-item group relative mb-0 flex w-52 shrink-0 items-stretch rounded-lg border transition lg:mb-2 lg:w-full lg:min-w-0"
        :class="
          activeId === item.id
            ? 'border-primary bg-accent/55 shadow-sm'
            : 'border-transparent hover:bg-muted/60'
        "
      >
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left lg:items-start lg:gap-3 lg:p-3"
          @click="emit('select', item.id)"
        >
          <span class="mt-0.5 font-mono text-[10px] text-muted-foreground/70 max-lg:hidden">{{
            String(index + 1).padStart(2, '0')
          }}</span>
          <!-- Mobile flattens this into one row: status dot · name · size. -->
          <span class="min-w-0 flex-1 max-lg:contents">
            <span class="block min-w-0 truncate text-xs font-medium max-lg:flex-1">{{
              item.name
            }}</span>
            <span
              class="mt-1 flex items-center gap-1.5 font-mono text-[9px] tracking-wide text-muted-foreground uppercase max-lg:contents"
            >
              <span
                class="size-1.5 shrink-0 rounded-full max-lg:order-first"
                :class="{
                  'bg-muted-foreground/40':
                    item.status === 'ready' &&
                    (item.analysisStatus === 'pending' || item.analysisStatus === 'failed'),
                  'animate-pulse bg-muted-foreground':
                    item.status === 'processing' || item.analysisStatus === 'analyzing',
                  'bg-primary':
                    item.status === 'done' ||
                    (item.status === 'ready' && item.analysisStatus === 'done'),
                  'bg-destructive': item.status === 'error'
                }"
              />
              <span class="max-lg:sr-only">{{ statusText(item) }}</span>
            </span>
          </span>
          <span
            class="shrink-0 font-mono text-[9px] text-muted-foreground lg:hidden"
            aria-hidden="true"
          >
            {{ formatBytes(item.size) }}
          </span>
        </button>
        <Button
          type="button"
          class="my-auto mr-2 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive lg:invisible lg:group-hover:visible lg:focus:visible"
          variant="ghost"
          size="icon-xs"
          :aria-label="t('queue.remove', { name: item.name })"
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
      {{ t('queue.clear') }}
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
          <AlertDialogCancel>{{ t('queue.cancel') }}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" @click="confirmPendingAction">
            {{ confirmationLabel }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </aside>
</template>
