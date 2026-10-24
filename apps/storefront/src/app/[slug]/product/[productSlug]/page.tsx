import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'switch-icons'
import Link from 'next/link'
import { createClient } from '../../../../lib/supabase/server'
import { getPublishedStore, whatsappLink } from '../../../../lib/store'
import { PriceTag } from '../../../../components/PriceTag'
import { AddToCartButton } from './AddToCartButton'
import { ProductGallery } from './ProductGallery'
import { ShareButton } from '../../../../components/ShareButton'
import { StatusShareButton } from '../../../../components/StatusShareButton'
import { RestockForm } from './RestockForm'
import { cldJpeg } from '@bitvora/lib/cloudinary-image'
import { VerifiedBadge } from '../../../../components/VerifiedBadge'

const LOW_STOCK_THRESHOLD = 5
// Below this, "1 sold this week" reads as weak rather than reassuring.
const MIN_SALES_TO_SHOW = 2

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  compare_at_price: number | null
  images: string[] | null
  stock_quantity: number | null
  sizes: string[] | null
}

const getProduct = cache(async (storeId: string, productSlug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, description, price, compare_at_price, images, stock_quantity, sizes')
    .eq('store_id', storeId)
    .eq('slug', productSlug)
    .eq('is_active', true)
    .maybeSingle()
  return data as Product | null
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}): Promise<Metadata> {
  const { slug, productSlug } = await params
  const store = await getPublishedStore(slug)
  if (!store) return {}
  const product = await getProduct(store.id, productSlug)
  if (!product) return { title: 'Product not found' }

  const price = `₦${Number(product.price).toLocaleString()}`
  const description = product.description
    ? `${price} — ${product.description.slice(0, 150)}`
    : `${price} at ${store.name}. Order online in minutes.`
  // Small JPEG on purpose: WhatsApp skips link previews with heavy images.
  const image = cldJpeg(product.images?.[0], 1200, 630)

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} · ${price}`,
      description,
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: product.name }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary' },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}) {
  const { slug, productSlug } = await params

  const store = await getPublishedStore(slug)
  if (!store) notFound()

  const product = await getProduct(store.id, productSlug)
  if (!product) notFound()

  const accent = store.palette?.primary || '#171717'
  const stock = product.stock_quantity ?? 0

  // Real units sold in the last 7 days (cancelled orders excluded).
  const supabase = await createClient()
  const { data: sales } = await supabase.rpc('recent_product_sales', { p_store_id: store.id, p_days: 7 })
  const soldThisWeek = Number(
    (sales as { product_id: string; units: number }[] | null)?.find((r) => r.product_id === product.id)?.units ?? 0
  )
  const waLink = whatsappLink(store.social_links)
  const whatsappNumber = waLink ? waLink.replace('https://wa.me/', '') : null

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link href={`/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#171717]">
          <ArrowLeft className="w-4 h-4" />
          Back to store
        </Link>
        <div className="flex items-center gap-2">
          <StatusShareButton
            slug={slug}
            productSlug={productSlug}
            text={`${product.name} — ₦${Number(product.price).toLocaleString()} at ${store.name}`}
          />
          <ShareButton
            title={product.name}
            text={`${product.name} — ₦${Number(product.price).toLocaleString()} at ${store.name}`}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
        <ProductGallery images={product.images ?? []} name={product.name} />

        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2 leading-tight">{product.name}</h1>
          <PriceTag price={product.price} compareAt={product.compare_at_price} size="lg" className="mb-4" />

          <div className="mb-5 flex flex-wrap items-center gap-2">
            {stock <= 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-red-700 bg-red-50 rounded-full px-3 py-1">
                Sold out
              </span>
            ) : stock <= LOW_STOCK_THRESHOLD ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-amber-800 bg-amber-50 rounded-full px-3 py-1">
                Only {stock} left
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 rounded-full px-3 py-1">
                In stock
              </span>
            )}
            {soldThisWeek >= MIN_SALES_TO_SHOW && (
              <span className="inline-flex items-center gap-1.5 text-sm text-orange-800 bg-orange-50 rounded-full px-3 py-1">
                🔥 {soldThisWeek} sold this week
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-[#525252] mb-6 whitespace-pre-line leading-relaxed">{product.description}</p>
          )}

          <AddToCartButton
            slug={slug}
            productId={product.id}
            name={product.name}
            price={Number(product.price)}
            image={product.images?.[0] ?? null}
            stock={stock}
            sizes={product.sizes ?? []}
            accent={accent}
            storeName={store.name}
            whatsappNumber={whatsappNumber}
          />

          {stock <= 0 && <RestockForm slug={slug} productId={product.id} storeName={store.name} accent={accent} />}

          {store.is_verified && (
            <div className="mt-6 rounded-lg bg-[#fafafa] px-3 py-2.5">
              <VerifiedBadge
                variant="inline"
                detail={<>{store.name}&apos;s identity was checked by Bitvora before they could sell here.</>}
              />
            </div>
          )}
        </div>
      </div>
      {/* Room for the sticky mobile buy bar so it never covers the footer. */}
      <div className="h-20 sm:hidden" aria-hidden="true" />
    </div>
  )
}
