'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconBrandWhatsapp, IconCheck, IconMinus, IconPlus, IconShoppingBag } from '@tabler/icons-react'
import { useCart, MAX_ITEM_QUANTITY } from '../../../../lib/cart-store'

export function AddToCartButton({
  slug,
  productId,
  name,
  price: basePrice,
  sizePrices = {},
  image,
  stock,
  sizes,
  accent,
  storeName,
  whatsappNumber,
}: {
  slug: string
  productId: string
  name: string
  price: number
  /** Prices the merchant set for some sizes; other sizes use `price`. */
  sizePrices?: Record<string, number>
  image: string | null
  /** Units left, or null when the merchant doesn't count stock (made to order). */
  stock: number | null
  /** The merchant's own sizes for this product; empty when it has none. */
  sizes: string[]
  accent: string
  storeName: string
  /** Digits only, international format (e.g. 2348012345678), or null if the store has none. */
  whatsappNumber: string | null
}) {
  const { addItem } = useCart(slug)
  const [added, setAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null)
  const [sizeMissing, setSizeMissing] = useState(false)
  const sizesRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const maxQuantity = Math.max(1, Math.min(stock ?? MAX_ITEM_QUANTITY, MAX_ITEM_QUANTITY))
  const priceOf = (s: string | null) => {
    const own = s ? Number(sizePrices[s]) : NaN
    return Number.isFinite(own) && own > 0 ? own : basePrice
  }
  const price = priceOf(size)
  const pricesVary = sizes.some((s) => priceOf(s) !== basePrice)

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
  const item = { productId, name, price, image, maxQuantity: stock ?? undefined, size: size ?? undefined }

  // A product with sizes can't go in the cart until one is picked.
  function sizeReady() {
    if (sizes.length === 0 || size) return true
    setSizeMissing(true)
    sizesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return false
  }

  function handleAdd() {
    if (!sizeReady()) return
    addItem(item, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  function handleBuyNow() {
    if (!sizeReady()) return
    addItem(item, quantity)
    router.push(`/${slug}/checkout`)
  }

  if (stock !== null && stock <= 0) {
    return (
      <button disabled className="w-full rounded-lg px-4 py-3.5 text-sm font-medium bg-[#f5f5f5] text-[#737373] cursor-not-allowed">
        Sold out
      </button>
    )
  }

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hi ${storeName},\nI'd like to order:\n\n*${name}* — ₦${price.toLocaleString()}${size ? `\nSize: ${size}` : ''}\nQuantity: ${quantity}`
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
      {sizes.length > 0 && (
        <div ref={sizesRef} className="mb-3">
          <p className="text-sm text-[#525252] mb-2" id="size-label">
            Size{size && <span className="text-[#171717] font-medium">: {size}</span>}
            {size && pricesVary && <span className="font-mono text-[#171717] font-medium"> · ₦{price.toLocaleString()}</span>}
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="size-label">
            {sizes.map((s) => {
              const selected = s === size
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setSize(s)
                    setSizeMissing(false)
                  }}
                  className={`min-w-11 rounded-lg border px-3.5 py-2 text-sm transition-colors ${
                    selected ? 'font-medium' : 'border-[#e5e5e5] hover:border-[#a3a3a3]'
                  }`}
                  style={selected ? { borderColor: accent, boxShadow: `inset 0 0 0 1px ${accent}` } : undefined}
                >
                  {s}
                  {pricesVary && (
                    <span className="block font-mono text-xs text-[#737373]">₦{priceOf(s).toLocaleString()}</span>
                  )}
                </button>
              )
            })}
          </div>
          {sizeMissing && (
            <p role="alert" className="text-sm text-red-600 mt-2">Choose a size first.</p>
          )}
        </div>
      )}
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
        <span aria-live="polite">{added ? <span className="inline-flex items-center gap-1">Added to cart <IconCheck className="w-4 h-4" /></span> : 'Add to cart'}</span>
      </button>

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-lg px-4 py-3 text-sm text-[#525252] hover:text-[#171717] transition-colors"
        >
          <IconBrandWhatsapp className="w-4 h-4" />
          Or order via WhatsApp
        </a>
      )}
    </div>
  )
}
