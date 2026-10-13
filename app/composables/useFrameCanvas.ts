import { toast } from 'vue-sonner'
import { FRAME_PLACEHOLDER_SIZE, FRAME_PREVIEW_SIDE, MAX_FRAME_CANVAS_SIDE } from '~/types/frame'
import type { FrameInfoFields, FrameSettings } from '~/types/frame'
import type { DecodedImage } from '~/types/image'
import type { FrameImageEntry } from '~/composables/useFrameImage'
import { canvasToBlob, downloadBlob } from '~/utils/download'
import { getLogoMark } from '~/utils/cameraBrands'
import { AppError, errorMessageKey } from '~/utils/errors'
import { isFrameFontReady, loadFrameFonts } from '~/utils/frameFonts'
import { loadFrameLogoImage } from '~/utils/frameLogos'
import { baseName } from '~/utils/image'
import {
  buildFrameCaption,
  clampFrameOutputSide,
  drawFrame,
  getFrameCanvasSize,
  getFrameLayout,
  getFrameScale,
  getFrameSceneFonts
} from '~/utils/photoFrame'
import type { FrameLogoAsset, FrameScene } from '~/utils/photoFrame'

interface FrameCanvasSources {
  photo: () => FrameImageEntry | undefined
  customLogo: () => FrameImageEntry | undefined
  settings: () => FrameSettings
  fields: () => FrameInfoFields
}

export const getFrameOutputLimit = (
  settings: Pick<FrameSettings, 'outputSizeMode' | 'outputLongSide'>
) =>
  settings.outputSizeMode === 'custom'
    ? (clampFrameOutputSide(settings.outputLongSide) ?? MAX_FRAME_CANVAS_SIDE)
    : MAX_FRAME_CANVAS_SIDE

/** Frame layout for the current photo, or the placeholder layout before one is imported. */
export const getFrameSceneLayout = (photo: FrameImageEntry | undefined, settings: FrameSettings) =>
  getFrameLayout(
    photo?.decoded.width ?? FRAME_PLACEHOLDER_SIZE.width,
    photo?.decoded.height ?? FRAME_PLACEHOLDER_SIZE.height,
    settings
  )

const releaseCanvas = (canvas: HTMLCanvasElement) => {
  canvas.width = 0
  canvas.height = 0
}

export const useFrameCanvas = (sources: FrameCanvasSources) => {
  const { t, locale } = useI18n()
  const translateError = useTranslatedError()
  const canvas = ref<HTMLCanvasElement>()
  const exporting = ref(false)
  const aspectRatio = ref(FRAME_PLACEHOLDER_SIZE.width / FRAME_PLACEHOLDER_SIZE.height)
  usePwaUpdateBlocker('frame-export', exporting)
  const logoAsset = shallowRef<FrameLogoAsset>()
  let logoReady: Promise<void> = Promise.resolve()
  let logoRequest = 0
  let previewOwner: DecodedImage | undefined
  let previewCanvas: HTMLCanvasElement | undefined
  let animationFrame: number | undefined
  let mounted = false

  const releasePreview = () => {
    if (previewCanvas) releaseCanvas(previewCanvas)
    previewCanvas = undefined
    previewOwner = undefined
  }

  // Redraws scale a cached copy so large scans are only downsampled once per photo.
  const getPreviewSource = (decoded: DecodedImage): CanvasImageSource => {
    if (previewOwner === decoded) return previewCanvas ?? decoded.source
    releasePreview()
    previewOwner = decoded
    const scale = Math.min(1, FRAME_PREVIEW_SIDE / Math.max(decoded.width, decoded.height))
    if (scale === 1) return decoded.source
    const preview = document.createElement('canvas')
    preview.width = Math.max(1, Math.round(decoded.width * scale))
    preview.height = Math.max(1, Math.round(decoded.height * scale))
    const context = preview.getContext('2d')
    if (!context) {
      releaseCanvas(preview)
      return decoded.source
    }
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(decoded.source, 0, 0, preview.width, preview.height)
    previewCanvas = preview
    return preview
  }

  const createScene = (photo: FrameImageEntry | undefined, source?: CanvasImageSource) => {
    const settings = sources.settings()
    return {
      layout: getFrameSceneLayout(photo, settings),
      settings,
      caption: buildFrameCaption(sources.fields(), settings),
      photo: source,
      logo: logoAsset.value,
      placeholder: t('frame.placeholder')
    } satisfies FrameScene
  }

  const drawPreview = () => {
    const target = canvas.value
    if (!target) return
    const faces = getFrameSceneFonts(sources.settings())
    if (!faces.every(isFrameFontReady)) void loadFrameFonts(faces).then(scheduleDraw)

    const photo = sources.photo()
    const scene = createScene(photo, photo && getPreviewSource(photo.decoded))
    const scale = getFrameScale(scene.layout, FRAME_PREVIEW_SIDE)
    const size = getFrameCanvasSize(scene.layout, scale)
    target.width = size.width
    target.height = size.height
    aspectRatio.value = size.width / size.height
    const context = target.getContext('2d')
    if (context) drawFrame(context, scene, scale)
  }

  function scheduleDraw() {
    if (!mounted) return
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
    animationFrame = requestAnimationFrame(() => {
      animationFrame = undefined
      drawPreview()
    })
  }

  const resolveLogo = async (request: number) => {
    const { logo } = sources.settings()
    const custom = sources.customLogo()
    let asset: FrameLogoAsset | undefined
    if (logo.style === 'mark' && logo.mark) {
      const image = await loadFrameLogoImage(logo.mark)
      const mark = getLogoMark(logo.mark)
      if (image?.naturalWidth && image.naturalHeight) {
        asset = {
          source: image,
          aspectRatio: image.naturalWidth / image.naturalHeight,
          tintable: mark?.tintable ?? false
        }
      }
    } else if (logo.style === 'custom' && custom) {
      asset = {
        source: custom.decoded.source,
        aspectRatio: custom.decoded.width / custom.decoded.height,
        tintable: true
      }
    }
    if (request !== logoRequest) return
    logoAsset.value = asset
    scheduleDraw()
  }

  const refreshLogo = () => {
    logoRequest += 1
    logoReady = resolveLogo(logoRequest)
  }

  const download = async () => {
    if (exporting.value) return
    const photo = sources.photo()
    if (!photo) {
      toast.warning(t('toast.addPhotoFirst'))
      return
    }

    let output: HTMLCanvasElement | undefined
    try {
      exporting.value = true
      await Promise.all([loadFrameFonts(getFrameSceneFonts(sources.settings())), logoReady])
      // The photo may have been replaced or removed (and disposed) while waiting.
      if (sources.photo() !== photo) return
      const settings = sources.settings()
      const scene = createScene(photo, photo.decoded.source)
      const scale = getFrameScale(scene.layout, getFrameOutputLimit(settings))
      const size = getFrameCanvasSize(scene.layout, scale)
      output = document.createElement('canvas')
      output.width = size.width
      output.height = size.height
      const context = output.getContext('2d')
      if (!context) throw new AppError('exportCanvasUnavailable')
      drawFrame(context, scene, scale)
      const blob = await canvasToBlob(output, settings.outputFormat, settings.outputQuality)
      const extension = settings.outputFormat === 'jpeg' ? 'jpg' : 'png'
      downloadBlob(blob, `${baseName(photo.name)}-frame.${extension}`)
      toast.success(t('frame.toast.generated'))
    } catch (error) {
      toast.error(t('frame.toast.failed'), {
        description: translateError(
          errorMessageKey(error, 'errors.frameFailed'),
          'errors.frameFailed'
        )
      })
    } finally {
      if (output) releaseCanvas(output)
      exporting.value = false
    }
  }

  watch(
    () => [sources.settings().logo.style, sources.settings().logo.mark, sources.customLogo()],
    () => {
      if (mounted) refreshLogo()
    }
  )
  watch(
    () => sources.photo(),
    (photo) => {
      if (!photo) releasePreview()
      scheduleDraw()
    }
  )
  watch([() => sources.settings(), () => sources.fields(), locale], scheduleDraw, { deep: true })

  onMounted(() => {
    mounted = true
    refreshLogo()
    scheduleDraw()
  })

  onBeforeUnmount(() => {
    mounted = false
    logoRequest += 1
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
    releasePreview()
  })

  return { canvas, aspectRatio, exporting, download }
}
