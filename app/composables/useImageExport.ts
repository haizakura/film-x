import { Zip, ZipPassThrough } from 'fflate'

import type { ExportFormat, ImageQueueItem } from '~/types/image'
import { downloadBlob } from '~/utils/download'
import { AppError, errorMessageKey } from '~/utils/errors'
import {
  baseName,
  calculateCropRects,
  decodeImage,
  outputExtension,
  renderCrop
} from '~/utils/image'

export interface ExportResult {
  generatedCount: number
  failedCount: number
}

/** Stored (uncompressed) ZIP built entry by entry, so frames are not held a second time. */
const createArchive = () => {
  const parts: Blob[] = []
  const archive = new Zip()
  const blob = new Promise<Blob>((resolve, reject) => {
    archive.ondata = (error, chunk, final) => {
      if (error) return reject(error)
      // A Blob per chunk lets the frame's buffer go; the browser may keep blob data off the heap.
      parts.push(new Blob([chunk as BlobPart]))
      if (final) resolve(new Blob(parts, { type: 'application/zip' }))
    }
  })
  // Errors surface when the archive is awaited; this only prevents an unhandled rejection.
  blob.catch(() => undefined)

  return {
    add: (name: string, data: Uint8Array) => {
      const entry = new ZipPassThrough(name)
      archive.add(entry)
      entry.push(data, true)
    },
    finish: () => {
      archive.end()
      return blob
    }
  }
}

export const useImageExport = () => {
  const { t } = useI18n()
  const format = ref<ExportFormat>('jpeg')
  const quality = ref(0.94)
  const exporting = ref(false)
  usePwaUpdateBlocker('splitter-export', exporting)
  const progress = ref(0)
  const progressState = ref<{ stage: 'processing'; name: string } | { stage: 'packing' }>()
  const progressLabel = computed(() => {
    if (progressState.value?.stage === 'processing') {
      return t('export.processing', { name: progressState.value.name })
    }
    return progressState.value?.stage === 'packing' ? t('export.packing') : ''
  })

  const exportItems = async (
    items: ImageQueueItem[],
    archiveName: string
  ): Promise<ExportResult | undefined> => {
    if (!items.length || exporting.value) return

    exporting.value = true
    progress.value = 0
    const archive = createArchive()
    const usedPrefixes = new Set<string>()
    let generatedCount = 0
    const extension = outputExtension(format.value)

    try {
      // TIFF scans are intentionally processed serially to cap memory use.
      // oxlint-disable no-await-in-loop
      for (const [index, item] of items.entries()) {
        item.status = 'processing'
        progressState.value = { stage: 'processing', name: item.name }
        let image: Awaited<ReturnType<typeof decodeImage>> | undefined

        try {
          image = await decodeImage(item.file)
          const [leftRect, rightRect] = calculateCropRects(image.width, image.height, item.settings)
          const left = await renderCrop(
            image,
            leftRect,
            item.settings.leftRotation,
            format.value,
            quality.value
          )
          const right = await renderCrop(
            image,
            rightRect,
            item.settings.rightRotation,
            format.value,
            quality.value
          )
          const leftData = new Uint8Array(await left.arrayBuffer())
          const rightData = new Uint8Array(await right.arrayBuffer())
          // roll1.jpg and roll1.tif would share a prefix; case-folded for case-insensitive disks.
          const base = baseName(item.name)
          let prefix = base
          for (let n = 2; usedPrefixes.has(prefix.toLowerCase()); n += 1) prefix = `${base}-${n}`
          usedPrefixes.add(prefix.toLowerCase())
          archive.add(`${prefix}_01.${extension}`, leftData)
          archive.add(`${prefix}_02.${extension}`, rightData)
          generatedCount += 2
          item.status = 'done'
          item.error = undefined
        } catch (error) {
          item.status = 'error'
          item.error = errorMessageKey(error, 'errors.processingFailed')
        } finally {
          image?.dispose()
        }

        progress.value = Math.round(((index + 1) / items.length) * 85)
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
      // oxlint-enable no-await-in-loop

      if (!generatedCount) throw new AppError('noImagesGenerated')

      progressState.value = { stage: 'packing' }
      const blob = await archive.finish()
      progress.value = 100
      downloadBlob(blob, `${archiveName}.zip`)

      return {
        generatedCount,
        failedCount: items.filter((item) => item.status === 'error').length
      }
    } finally {
      exporting.value = false
      progressState.value = undefined
    }
  }

  return { format, quality, exporting, progress, progressLabel, exportItems }
}
