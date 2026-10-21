'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconMinus, IconPlus, IconShoppingBag } from '@tabler/icons-react'
import { useCart, MAX_ITEM_QUANTITY } from '../../../../lib/cart-store'
import { BrandIcon } from '../../../../components/BrandIcon'

export function AddToCartButton({
  slug,
  productId,
  name,
  price,
  image,
  stock,
  accent,
  storeName,
  whatsappNumber,
}: {
  slug: string
  productId: string
  name: string
  price: number
  image: string | null
  stock: number
  accent: string
  storeName: string
  /** Digits only, international format (e.g. 2348012345678), or null if the store has none. */
  whatsappNumber: string | null
}) {
  const { addItem } = useCart(slug)
  const [added, setAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const router = useRouter()
  const maxQuantity = Math.max(1, Math.min(stock, MAX_ITEM_QUANTITY))

  // Phones: once the main buttons scroll out of view, a sticky bottom bar
  // keeps price + Buy now within thumb reach.
  const actionsRef = useRef<HTMLDivElement>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)
  useEffect(() => {
    const el = actionsRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const item = { productId, name, price, image, maxQuantity: stock }

  function handleAdd() {
    addItem(item, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  function handleBuyNow() {
    addItem(item, quantity)
    router.push(`/${slug}/checkout`)
  }

  if (stock <= 0) {
    return (
      <button disabled className="w-full rounded-lg px-4 py-3.5 text-sm font-medium bg-[#f5f5f5] text-[#737373] cursor-not-allowed">
        Sold out
      </button>
    )
  }

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hi ${storeName} 👋\nI'd like to order:\n\n*${name}* — ₦${price.toLocaleString()}\nQuantity: ${quantity}`
      )}`
    : null

  return (
    <div className="space-y-2.5" ref={actionsRef}>
      <div
        className={`sm:hidden fixed inset-x-0 bottom-0 z-20 border-t border-[#e5e5e5] bg-white/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3 transition-transform duration-200 ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!showStickyBar}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[#737373] truncate">{name}</p>
          <p className="font-mono font-semibold">₦{price.toLocaleString()}</p>
        </div>
        <button
          onClick={handleBuyNow}
          tabIndex={showStickyBar ? 0 : -1}
          className="shrink-0 rounded-lg px-6 py-3 text-sm font-medium text-white"
          style={{ backgroundColor: accent, color: 'var(--accent-fg)' }}
        >
          Buy now
        </button>
      </div>
      <div className="flex items-center gap-3 mb-1">
        <span className="text-sm text-[#525252]" id="qty-label">Quantity</span>
        <div className="flex items-center border border-[#e5e5e5] rounded-lg" role="group" aria-labelledby="qty-label">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="p-2.5 disabled:opacity-30"
          >
            <IconMinus className="w-4 h-4" stroke={1.75} />
          </button>
          <span className="w-8 text-center font-mono text-sm" aria-live="polite">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            disabled={quantity >= maxQuantity}
            aria-label="Increase quantity"
            className="p-2.5 disabled:opacity-30"
          >
            <IconPlus className="w-4 h-4" stroke={1.75} />
          </button>
        </div>
      </div>

      <button
        onClick={handleBuyNow}
        className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: accent, color: 'var(--accent-fg)' }}
      >
        Buy now
      </button>
      <button
        onClick={handleAdd}
        className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-3.5 text-sm font-medium border border-[#e5e5e5] hover:bg-[#fafafa] transition-colors"
      >
        <IconShoppingBag className="w-4 h-4" stroke={1.75} />
        <span aria-live="polite">{added ? 'Added to cart ✓' : 'Add to cart'}</span>
      </button>

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-3 text-sm text-[#525252] hover:text-[#171717] transition-colors"
        >
          <BrandIcon icon="Whatsapp" className="w-4 h-4" />
          Or order via WhatsApp
        </a>
      )}
    </div>
  )
}
