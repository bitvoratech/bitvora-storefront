const UPLOAD_MARKER = '/image/upload/'

/**
 * Returns a resized, auto-format (WebP/AVIF), auto-quality version of a
 * Cloudinary URL. Originals can be several MB — far too heavy for shoppers
 * on mobile data. Non-Cloudinary URLs are returned unchanged.
 */
export function cldImage(url: string | null | undefined, width: number): string {
  if (!url) return ''
  const i = url.indexOf(UPLOAD_MARKER)
  if (!url.startsWith('https://res.cloudinary.com/') || i === -1) return url
  const head = url.slice(0, i + UPLOAD_MARKER.length)
  const tail = url.slice(i + UPLOAD_MARKER.length)
  return `${head}f_auto,q_auto,c_limit,w_${width}/${tail}`
}

/**
 * JPEG cropped to an exact box. For consumers that can't take WebP/AVIF:
 * link-preview crawlers (WhatsApp, Facebook) and the Satori image renderer.
 */
export function cldJpeg(url: string | null | undefined, width: number, height: number): string | null {
  if (!url) return null
  const i = url.indexOf(UPLOAD_MARKER)
  if (!url.startsWith('https://res.cloudinary.com/') || i === -1) return url
  const head = url.slice(0, i + UPLOAD_MARKER.length)
  const tail = url.slice(i + UPLOAD_MARKER.length)
  return `${head}f_jpg,q_80,c_fill,g_auto,w_${width},h_${height}/${tail}`
}
