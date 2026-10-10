'use client'

import Link from 'next/link'

import { useRouter } from 'next/navigation'
import { PackageBox } from 'switch-icons'
import { useCart } from '../../lib/cart-store'

type Product = {
  id: string
  slug: string
  name: string
  price: number
  category: string | null
  images: string[] | null
  stock_quantity: number
}

export function ProductCard({ product, storeSlug, accent }: { product: Product; storeSlug: string; accent: string }) {
  const { addItem } = useCart(storeSlug)
  const router = useRouter()
  const inStock = product.stock_quantity > 0

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.images?.[0] ?? null })
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault()
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.images?.[0] ?? null })
    router.push(`/${storeSlug}/checkout`)
  }

  return (
    <div className="bg-storefront-bg border border-storefront-border rounded-xl overflow-hidden group">
      <Link href={`/${storeSlug}/product/${product.slug}`} className="block">
        <div className="aspect-square bg-[#fafafa] p-6 relative">
          {product.category && (
            <span className="absolute top-3 right-3 bg-white text-[9px] sm:text-[10px] uppercase tracking-wide text-[#a3a3a3] rounded-full px-2 py-1 z-10 max-w-[45%] truncate">
              {product.category}
            </span>
          )}
          {!inStock && (
            <span className="absolute top-3 left-3 bg-white text-[10px] uppercase tracking-wide text-red-600 rounded-full px-2.5 py-1 z-10">
              Out of stock
            </span>
          )}
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PackageBox className="w-8 h-8 text-[#d4d4d4]" />
            </div>
          )}
        </div>
        <div className="p-4 pb-2">
          <p className="font-mono font-semibold text-lg">₦{Number(product.price).toLocaleString()}</p>
          <p className="text-sm text-[#525252] mt-0.5">{product.name}</p>
        </div>
      </Link>

      <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2 ">
        <button
          onClick={handleAdd}
          disabled={!inStock}
          className="rounded-full border border-[#e5e5e5] text-xs font-medium py-2 hover:bg-[#fafafa] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add to Cart
        </button>
        <button
          onClick={handleBuyNow}
          disabled={!inStock}
          className="rounded-full text-white text-xs font-medium py-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: accent }}
        >
          Buy Now
        </button>
      </div>
    </div>
  )
}