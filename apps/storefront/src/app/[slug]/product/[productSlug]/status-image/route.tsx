import { NextRequest } from 'next/server'
import { loadShareData, renderStatusImage } from '../../../../../lib/share-image'
import { getClientIp, rateLimit } from '../../../../../lib/rate-limit'

// 1080×1920 product image for WhatsApp Status / Instagram Stories.
// Used by the storefront "Share to Status" button and the merchant's
// "Status image" download in the admin.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const rl = await rateLimit('status-image', await getClientIp(), 30, '1 m')
  if (!rl.ok) return new Response('Too many requests', { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })

  const { slug, productSlug } = await params
  const data = await loadShareData(slug, productSlug)
  if (!data) return new Response('Not found', { status: 404 })

  const host = req.nextUrl.host
  const image = await renderStatusImage({ ...data, storeHost: host })

  if (req.nextUrl.searchParams.get('download') === '1') {
    image.headers.set('Content-Disposition', `attachment; filename="${productSlug}-status.png"`)
  }
  return image
}
