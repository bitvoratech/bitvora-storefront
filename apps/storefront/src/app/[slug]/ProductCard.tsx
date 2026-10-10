'use client'

/* eslint-disable @next/next/no-img-element -- Cloudinary-resized images via cldImage() */
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PackageBox } from 'switch-icons'
import { useCart } from '../../lib/cart-store'
import { cldImage } from '../../lib/cloudinary-image'
import { PriceTag } from '../../components/PriceTag'

type Product = {
  id: string
  slug: string
  name: string
  price: number
  compare_at_price?: number | null
  category: string | null
  images: string[] | null
  stock_quantity: number
}

export function ProductCard({
  product,
  storeSlug,
  accent,
  badge,
}: {
  product: Product
  storeSlug: string
  accent: string
  /** e.g. "Bestseller" — only ever derived from real sales. */
  badge?: string
}) {
  const { addItem } = useCart(storeSlug)
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const inStock = product.stock_quantity > 0
  const cartItem = { productId: product.id, name: product.name, price: Number(product.price), image: product.images?.[0] ?? null }

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    addItem(cartItem)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault()
    addItem(cartItem)
    router.push(`/${storeSlug}/checkout`)
  }

  return (
    <div className="bg-white border border-[#ececec] rounded-xl overflow-hidden group flex flex-col">
      <Link href={`/${storeSlug}/product/${product.slug}`} className="block flex-1">
        <div className="aspect-square bg-[#fafafa] relative overflow-hidden">
          {product.category && (
            <span className="absolute top-2 right-2 bg-white/95 text-[10px] uppercase tracking-wide text-[#525252] rounded-full px-2 py-1 z-10 max-w-[55%] truncate">
              {product.category}
            </span>
          )}
          {!inStock ? (
            <span className="absolute top-2 left-2 bg-white/95 text-[10px] uppercase tracking-wide font-medium text-red-700 rounded-full px-2 py-1 z-10">
              Sold out
            </span>
          ) : badge ? (
            <span
              className="absolute top-2 left-2 text-[10px] uppercase tracking-wide font-semibold text-white rounded-full px-2 py-1 z-10"
              style={{ backgroundColor: accent }}
            >
              {badge}
            </span>
          ) : null}
          {product.images?.[0] ? (
            <img
              src={cldImage(product.images[0], 600)}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${inStock ? '' : 'opacity-60'}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PackageBox className="w-8 h-8 text-[#d4d4d4]" />
            </div>
          )}
        </div>
        <div className="p-3 sm:p-4 pb-2">
          <p className="text-sm font-medium text-[#171717] leading-snug line-clamp-2">{product.name}</p>
          <PriceTag price={product.price} compareAt={product.compare_at_price} className="mt-1" />
        </div>
      </Link>

      <div className="px-3 sm:px-4 pb-3 sm:pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        <button
          onClick={handleAdd}
          disabled={!inStock}
          className="rounded-full border border-[#e5e5e5] text-xs font-medium py-2 hover:bg-[#fafafa] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span aria-live="polite">{added ? 'Added ✓' : 'Add to cart'}</span>
        </button>
        <button
          onClick={handleBuyNow}
          disabled={!inStock}
          className="rounded-full text-white text-xs font-medium py-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: accent }}
        >
          Buy now
        </button>
      </div>
    </div>
  )
}
