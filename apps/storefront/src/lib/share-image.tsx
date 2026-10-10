/* eslint-disable @next/next/no-img-element -- rendered by Satori (next/og), not the browser */
import { ImageResponse } from 'next/og'
import { cache } from 'react'
import { createClient } from './supabase/server'
import { getPublishedStore, type PublicStore } from './store'
import { cldJpeg } from './cloudinary-image'

export type ShareProduct = {
  id: string
  name: string
  price: number
  compare_at_price: number | null
  images: string[] | null
}

export const getShareProduct = cache(async (storeId: string, productSlug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, price, compare_at_price, images')
    .eq('store_id', storeId)
    .eq('slug', productSlug)
    .eq('is_active', true)
    .maybeSingle()
  return data as ShareProduct | null
})

export async function loadShareData(slug: string, productSlug: string) {
  const store = await getPublishedStore(slug)
  if (!store) return null
  const product = await getShareProduct(store.id, productSlug)
  if (!product) return null
  return { store, product }
}

/**
 * Fetch the photo ourselves (with a timeout) and inline it, so a slow or
 * failed fetch degrades to a placeholder instead of a blank render.
 */
async function fetchAsDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const type = res.headers.get('content-type') ?? 'image/jpeg'
    const buf = Buffer.from(await res.arrayBuffer())
    return `data:${type};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

type LoadedFont = { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }
const fontCache = new Map<string, Promise<LoadedFont[] | null>>()

/**
 * Inter, subset by Google Fonts to exactly the characters on the card —
 * Satori's built-in font has no ₦. Without a browser User-Agent Google
 * serves TTF, which Satori can read.
 */
function loadFonts(text: string): Promise<LoadedFont[] | null> {
  const chars = [...new Set(text)].sort().join('')
  const cached = fontCache.get(chars)
  if (cached) return cached

  const load = (async () => {
    try {
      return await Promise.all(
        ([400, 700] as const).map(async (weight) => {
          const css = await fetch(
            `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(chars)}`,
            { signal: AbortSignal.timeout(4000) }
          ).then((r) => r.text())
          const src = css.match(/src:\s*url\(([^)]+)\)/)?.[1]
          if (!src) throw new Error('No font URL in Google Fonts response')
          const data = await fetch(src, { signal: AbortSignal.timeout(4000) }).then((r) => r.arrayBuffer())
          return { name: 'Inter', data, weight, style: 'normal' as const }
        })
      )
    } catch {
      fontCache.delete(chars) // don't cache failures
      return null
    }
  })()

  if (fontCache.size > 200) fontCache.clear()
  fontCache.set(chars, load)
  return load
}

// Drawn rather than typed: most fonts have no ✓ glyph.
function CheckIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  )
}

function PhotoPlaceholder({ initial, accent }: { initial: string; accent: string }) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f1f1',
        color: accent,
        fontSize: 220,
        fontWeight: 700,
      }}
    >
      {initial}
    </div>
  )
}

/**
 * 1080×1920 product card for WhatsApp Status / Instagram Stories.
 * (Link previews deliberately use a plain Cloudinary JPEG instead — WhatsApp
 * drops preview images much over ~300 KB, and a PNG with a photo is ~1 MB+.)
 */
export async function renderStatusImage({
  store,
  product,
  storeHost,
}: {
  store: PublicStore
  product: ShareProduct
  storeHost: string
}) {
  const accent = store.palette?.primary || '#171717'
  const price = Number(product.price)
  const was = product.compare_at_price ? Number(product.compare_at_price) : 0
  const onSale = was > price
  const link = `${storeHost}/${store.slug}`
  const initial = (store.name.trim()[0] ?? 'B').toUpperCase()
  const photoUrl = cldJpeg(product.images?.[0], 1080, 1240)
  const maxName = 48
  const productName = product.name.length > maxName ? `${product.name.slice(0, maxName - 3)}…` : product.name

  const [photo, fonts] = await Promise.all([
    fetchAsDataUrl(photoUrl),
    loadFonts(`${store.name}${productName}${link}0123456789,.%₦…OFF Verified seller Order now NG`),
  ])
  // Without our font there's no ₦ glyph — spell the currency out instead.
  const naira = (n: number) => `${fonts ? '₦' : 'NGN '}${n.toLocaleString('en-NG')}`
  const fontOptions = fonts ? { fonts } : {}

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: accent, fontFamily: 'Inter' }}>
        <div style={{ display: 'flex', width: 1080, height: 1240, background: '#f4f4f4', position: 'relative' }}>
          {photo ? (
            <img src={photo} width={1080} height={1240} style={{ objectFit: 'cover' }} alt="" />
          ) : (
            <PhotoPlaceholder initial={initial} accent={accent} />
          )}
          {onSale && (
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: 48,
                left: 48,
                background: '#dc2626',
                color: '#ffffff',
                fontSize: 40,
                fontWeight: 700,
                padding: '12px 28px',
                borderRadius: 999,
              }}
            >
              {Math.round(((was - price) / was) * 100)}% OFF
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '56px 64px', color: '#ffffff' }}>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{productName}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 24 }}>
            <div style={{ display: 'flex', fontSize: 80, fontWeight: 700 }}>{naira(price)}</div>
            {onSale && (
              <div style={{ display: 'flex', fontSize: 44, opacity: 0.7, textDecoration: 'line-through', marginLeft: 24 }}>
                {naira(was)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flex: 1 }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.14)',
              borderRadius: 28,
              padding: '28px 36px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 36, fontWeight: 700 }}>
                {store.name}
                {store.is_verified && (
                  <div style={{ display: 'flex', marginLeft: 12 }}>
                    <CheckIcon size={34} color="#ffffff" />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', fontSize: 32, opacity: 0.85, marginTop: 6 }}>{link}</div>
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 34,
                fontWeight: 700,
                background: '#ffffff',
                color: '#171717',
                padding: '18px 30px',
                borderRadius: 999,
              }}
            >
              Order now
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: { 'Cache-Control': 'public, max-age=600, s-maxage=3600' },
      ...fontOptions,
    }
  )
}
