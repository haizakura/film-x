import type { MaybeRefOrGetter } from 'vue'

export const usePwaUpdate = () => {
  const blockers = useState<Record<string, boolean>>('pwa-update-blockers', () => ({}))
  const updateReady = useState('pwa-update-ready', () => false)
  const hasWork = computed(() => Object.values(blockers.value).some(Boolean))

  return { blockers, updateReady, hasWork }
}

export const usePwaUpdateBlocker = (key: string, blocked: MaybeRefOrGetter<boolean>) => {
  const { blockers } = usePwaUpdate()
  // Keep watching deactivated pages: their images are retained by NuxtPage keepalive.
  watch(
    () => toValue(blocked),
    (value) => {
      blockers.value[key] = value
    },
    { immediate: true, flush: 'sync' }
  )
  onBeforeUnmount(() => {
    delete blockers.value[key]
  })
}
