'use client'


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '../../../../lib/cart-store'
import { IconShoppingBag } from '@tabler/icons-react'

export function AddToCartButton({
  slug,
  productId,
  name,
  price,
  image,
  inStock,
  accent,
}: {
  slug: string
  productId: string
  name: string
  price: number
  image: string | null
  inStock: boolean
  accent: string
}) {
  const { addItem } = useCart(slug)
  const [added, setAdded] = useState(false)
  const router = useRouter()

  function handleAdd() {
    addItem({ productId, name, price, image })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  function handleBuyNow() {
    addItem({ productId, name, price, image })
    router.push(`/${slug}/checkout`)
  }

  if (!inStock) {
    return (
      <button disabled className="w-full rounded-lg px-4 py-3.5 text-sm font-medium bg-[#f5f5f5] text-[#a3a3a3] cursor-not-allowed">
        Out of stock
      </button>
    )
  }

  return (
    <div className="space-y-2.5">
      <button
        onClick={handleBuyNow}
        className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: accent }}
      >
        Buy Now
      </button>
      <button
        onClick={handleAdd}
        className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-3.5 text-sm font-medium border border-[#e5e5e5] hover:bg-[#fafafa] transition-colors"
      >
        <IconShoppingBag className="w-4 h-4"   stroke={1.75} />
        {added ? 'Added ✓' : 'Add to Cart'}
      </button>
    </div>
  )
}