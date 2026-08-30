import type { ImageQueueItem, SplitSettings } from '~/types/image'
import { DEFAULT_SETTINGS, partitionSupportedImages } from '~/utils/image'

export interface AddFilesResult {
  addedCount: number
  rejectedCount: number
  addedItems: ImageQueueItem[]
}

const createSettings = (): SplitSettings => ({ ...DEFAULT_SETTINGS })

export const useImageQueue = () => {
  const queue = ref<ImageQueueItem[]>([])
  const activeId = ref<string>()

  const activeItem = computed(() => queue.value.find((item) => item.id === activeId.value))
  const totalSize = computed(() => queue.value.reduce((sum, item) => sum + item.size, 0))
  const completedCount = computed(() => queue.value.filter((item) => item.status === 'done').length)

  const addFiles = (files: File[]): AddFilesResult => {
    const { supported, rejectedCount } = partitionSupportedImages(files)
    const knownFiles = new Set(queue.value.map((item) => `${item.name}:${item.size}`))
    const unique = supported.filter((file) => !knownFiles.has(`${file.name}:${file.size}`))

    const addedItems: ImageQueueItem[] = unique.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      status: 'ready' as const,
      analysisStatus: 'pending' as const,
      settings: createSettings()
    }))
    queue.value.push(...addedItems)

    if (!activeId.value && queue.value[0]) activeId.value = queue.value[0].id

    return { addedCount: unique.length, rejectedCount, addedItems }
  }

  const removeItem = (id: string) => {
    const index = queue.value.findIndex((item) => item.id === id)
    if (index === -1) return
    queue.value.splice(index, 1)

    if (activeId.value === id) {
      activeId.value = queue.value[Math.min(index, queue.value.length - 1)]?.id
    }
  }

  const clearQueue = () => {
    queue.value = []
    activeId.value = undefined
  }

  const updateActiveSettings = (settings: SplitSettings) => {
    if (activeItem.value) {
      if (
        activeItem.value.settings.center !== settings.center ||
        activeItem.value.settings.gap !== settings.gap
      ) {
        activeItem.value.settingsTouched = true
      }
      activeItem.value.settings = settings
    }
  }

  const applySettingsToAll = (settings: SplitSettings) => {
    for (const item of queue.value) {
      item.settings = { ...settings }
      item.settingsTouched = true
    }
  }

  const resetActiveSettings = () => {
    if (!activeItem.value) return
    activeItem.value.settings = {
      ...createSettings(),
      ...activeItem.value.detectedSettings
    }
    activeItem.value.settingsTouched = false
  }

  return {
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
  }
}
