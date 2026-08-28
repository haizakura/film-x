import { zip } from 'fflate'

import type { ExportFormat, ImageQueueItem } from '~/types/image'
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

const makeZip = (files: Record<string, Uint8Array>) =>
  new Promise<Uint8Array>((resolve, reject) => {
    zip(files, { level: 0 }, (error, data) => (error ? reject(error) : resolve(data)))
  })

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const useImageExport = () => {
  const format = ref<ExportFormat>('jpeg')
  const quality = ref(0.94)
  const exporting = ref(false)
  const progress = ref(0)
  const progressLabel = ref('')

  const exportItems = async (
    items: ImageQueueItem[],
    archiveName: string
  ): Promise<ExportResult | undefined> => {
    if (!items.length || exporting.value) return

    exporting.value = true
    progress.value = 0
    const files: Record<string, Uint8Array> = {}
    const extension = outputExtension(format.value)

    try {
      // TIFF scans are intentionally processed serially to cap memory use.
      // oxlint-disable no-await-in-loop
      for (const [index, item] of items.entries()) {
        item.status = 'processing'
        progressLabel.value = `正在处理 ${item.name}`
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
          const prefix = baseName(item.name)
          files[`${prefix}_01.${extension}`] = new Uint8Array(await left.arrayBuffer())
          files[`${prefix}_02.${extension}`] = new Uint8Array(await right.arrayBuffer())
          item.status = 'done'
          item.error = undefined
        } catch (error) {
          item.status = 'error'
          item.error = error instanceof Error ? error.message : '处理失败'
        } finally {
          image?.dispose()
        }

        progress.value = Math.round(((index + 1) / items.length) * 85)
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
      // oxlint-enable no-await-in-loop

      const generatedCount = Object.keys(files).length
      if (!generatedCount) throw new Error('没有成功生成的图像')

      progressLabel.value = '正在打包 ZIP'
      const archive = await makeZip(files)
      progress.value = 100
      downloadBlob(
        new Blob([archive as BlobPart], { type: 'application/zip' }),
        `${archiveName}.zip`
      )

      return {
        generatedCount,
        failedCount: items.filter((item) => item.status === 'error').length
      }
    } finally {
      exporting.value = false
      progressLabel.value = ''
    }
  }

  return { format, quality, exporting, progress, progressLabel, exportItems }
}
