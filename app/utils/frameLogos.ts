import type { FrameLogoSettings } from '~/types/frame'
import type { DecodedImage } from '~/types/image'
import { getLogoMark } from '~/utils/cameraBrands'
import type { FrameLogoAsset } from '~/utils/photoFrame'

// Logo artwork stays out of the main bundle; each SVG becomes a lazily loaded chunk.
const logoSources = import.meta.glob<string>('../assets/frame-logos/*.svg', {
  query: '?raw',
  import: 'default'
})

// Firefox only draws SVG images with intrinsic dimensions; vectors still render sharp when scaled.
const LOGO_INTRINSIC_HEIGHT = 256

const logoPath = (id: string) => `../assets/frame-logos/${id}.svg`

const withIntrinsicSize = (svg: string) => {
  const viewBox = /viewBox\s*=\s*["']([^"']+)["']/.exec(svg)?.[1]
  const [, , width, height] =
    viewBox
      ?.trim()
      .split(/[\s,]+/)
      .map(Number) ?? []
  if (!width || !height || !Number.isFinite(width / height)) return svg
  const intrinsicWidth = Math.round((LOGO_INTRINSIC_HEIGHT * width) / height)
  return svg.replace(
    /<svg\b([^>]*)>/,
    (_, attributes: string) =>
      `<svg${attributes.replace(/\s(?:width|height)\s*=\s*["'][^"']*["']/g, '')} width="${intrinsicWidth}" height="${LOGO_INTRINSIC_HEIGHT}">`
  )
}

const urlCache = new Map<string, Promise<string | undefined>>()
const imageCache = new Map<string, Promise<HTMLImageElement | undefined>>()

/** Data URL for previews and canvas drawing; data URLs never taint the canvas. */
export const loadFrameLogoUrl = (id: string) => {
  let pending = urlCache.get(id)
  if (!pending) {
    const load = logoSources[logoPath(id)]
    pending = load
      ? load().then(
          (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withIntrinsicSize(svg))}`,
          () => undefined
        )
      : Promise.resolve(undefined)
    urlCache.set(id, pending)
  }
  return pending
}

export const loadFrameLogoImage = (id: string) => {
  let pending = imageCache.get(id)
  if (!pending) {
    pending = loadFrameLogoUrl(id).then((url) => {
      if (!url) return undefined
      return new Promise<HTMLImageElement | undefined>((resolve) => {
        const image = new Image()
        image.decoding = 'async'
        image.onload = () => resolve(image)
        image.onerror = () => resolve(undefined)
        image.src = url
      })
    })
    imageCache.set(id, pending)
  }
  return pending
}

/** Drawable logo artwork for the current settings; undefined when there is nothing to draw. */
export const resolveFrameLogoAsset = async (
  logo: Pick<FrameLogoSettings, 'style' | 'mark'>,
  custom?: DecodedImage
): Promise<FrameLogoAsset | undefined> => {
  if (logo.style === 'mark' && logo.mark) {
    const image = await loadFrameLogoImage(logo.mark)
    const mark = getLogoMark(logo.mark)
    if (image?.naturalWidth && image.naturalHeight) {
      return {
        source: image,
        aspectRatio: image.naturalWidth / image.naturalHeight,
        tintable: mark?.tintable ?? false
      }
    }
  } else if (logo.style === 'custom' && custom) {
    return {
      source: custom.source,
      aspectRatio: custom.width / custom.height,
      tintable: true
    }
  }
  return undefined
}
