export const useImageDrop = (acceptFiles: (files: File[]) => void | Promise<void>) => {
  const isDragging = ref(false)

  const handleDragEnter = () => {
    isDragging.value = true
  }

  const handleDragOver = (event: DragEvent) => {
    isDragging.value = true
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }

  const handleDragLeave = (event: DragEvent) => {
    const container = event.currentTarget as HTMLElement
    const nextTarget = event.relatedTarget as Node | null
    if (!nextTarget || !container.contains(nextTarget)) isDragging.value = false
  }

  const handleDrop = async (event: DragEvent) => {
    isDragging.value = false
    const files = [...(event.dataTransfer?.files || [])]
    if (files.length) await acceptFiles(files)
  }

  return { isDragging, handleDragEnter, handleDragOver, handleDragLeave, handleDrop }
}
