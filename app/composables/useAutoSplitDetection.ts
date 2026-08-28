import type { DecodedImage, ImageQueueItem } from '~/types/image'
import { decodeImage } from '~/utils/image'
import { detectSplit } from '~/utils/splitDetection'

export const useAutoSplitDetection = () => {
  const analyzingCount = ref(0)

  interface AnalysisJob {
    items: ImageQueueItem[]
    force: boolean
    resolve: () => void
  }

  const jobs: AnalysisJob[] = []
  let worker: Promise<void> | undefined

  const applyDetection = (item: ImageQueueItem, image: DecodedImage, force: boolean) => {
    const result = detectSplit(image)
    item.detectedSettings = { center: result.center, gap: result.gap }
    if (force || !item.settingsTouched) {
      item.settings = { ...item.settings, center: result.center, gap: result.gap }
      item.settingsTouched = false
    }
    item.analysisStatus = 'done'
  }

  const analyzeDecodedItem = (item: ImageQueueItem, image: DecodedImage, force = false) => {
    item.analysisStatus = 'analyzing'
    try {
      applyDetection(item, image, force)
    } catch {
      item.analysisStatus = 'failed'
    }
  }

  const runAnalysis = async (items: ImageQueueItem[], force: boolean) => {
    // Decode serially: large TIFF batches otherwise retain several full-size buffers at once.
    // oxlint-disable no-await-in-loop
    for (const item of items) {
      item.analysisStatus = 'analyzing'
      analyzingCount.value += 1
      let image: Awaited<ReturnType<typeof decodeImage>> | undefined

      try {
        image = await decodeImage(item.file)
        applyDetection(item, image, force)
      } catch {
        item.analysisStatus = 'failed'
      } finally {
        image?.dispose()
        analyzingCount.value -= 1
      }

      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    // oxlint-enable no-await-in-loop
  }

  const drainJobs = async () => {
    // Keep image decoding serial to bound memory use for full-resolution TIFF batches.
    // oxlint-disable no-await-in-loop
    while (jobs.length) {
      const job = jobs.shift()
      if (!job) continue
      await runAnalysis(job.items, job.force)
      job.resolve()
    }
    // oxlint-enable no-await-in-loop
  }

  const analyzeItems = (items: ImageQueueItem[], force = false) => {
    if (!items.length) return worker ?? Promise.resolve()
    for (const item of items) item.analysisStatus = 'pending'

    const completed = new Promise<void>((resolve) => jobs.push({ items, force, resolve }))
    if (!worker) {
      worker = drainJobs().finally(() => {
        worker = undefined
      })
    }

    return completed
  }

  return { analyzingCount: readonly(analyzingCount), analyzeDecodedItem, analyzeItems }
}
