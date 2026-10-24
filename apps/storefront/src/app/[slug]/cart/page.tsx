'use client'

import { use, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { PackageBox, ArrowLeft } from 'switch-icons'
import { IconMinus, IconPlus, IconTrash } from '@tabler/icons-react'
import { lineKey, lineLimit, useCart } from '../../../lib/cart-store'
import { cldImage } from '@bitvora/lib/cloudinary-image'

export default function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { items, updateQuantity, removeItem, total } = useCart(slug)
  // The cart lives in localStorage: render nothing on the server so the first
  // client render doesn't mismatch (empty server cart vs. stored items).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  if (!mounted) return <div className="min-h-[40vh]" aria-busy="true" />

  return (
    <div>
      <Link href={`/${slug}`} className="flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#171717] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Continue shopping
      </Link>

      <h1 className="text-2xl font-semibold mb-6">Your cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <PackageBox className="w-8 h-8 text-[#d4d4d4] mx-auto mb-3" />
          <p className="text-[#737373]">Your cart is empty.</p>
          <Link href={`/${slug}`} className="text-sm mt-2 inline-block underline">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-4">
           {items.map((item) => (
        <div key={lineKey(item)} className="flex gap-4 border-b border-[#e5e5e5] pb-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-[#fafafa] shrink-0">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cldImage(item.image, 200)} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PackageBox className="w-6 h-6 text-[#d4d4d4]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{item.name}</p>
              {item.size && <p className="text-xs text-[#525252] mt-0.5">Size: {item.size}</p>}
              <p className="text-sm text-[#737373] font-mono mt-0.5">₦{item.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div>
                {/* 40px buttons: the old 20px ones were hard to hit on a phone. */}
                <div className="flex items-center border border-[#e5e5e5] rounded-lg">
                  <button onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)} aria-label={`Decrease quantity of ${item.name}`} className="w-10 h-10 flex items-center justify-center">
                    <IconMinus className="w-4 h-4" stroke={1.75} />
                  </button>
                  <span className="text-sm font-mono min-w-6 text-center" aria-live="polite">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                    disabled={item.quantity >= lineLimit(item)}
                    aria-label={`Increase quantity of ${item.name}`}
                    className="w-10 h-10 flex items-center justify-center disabled:opacity-30"
                  >
                    <IconPlus className="w-4 h-4" stroke={1.75} />
                  </button>
                </div>
                {item.maxQuantity != null && item.quantity >= item.maxQuantity && (
                  <p className="text-[11px] text-[#737373] mt-1 text-center">Only {item.maxQuantity} in stock</p>
                )}
              </div>
              <button onClick={() => removeItem(item.productId, item.size)} aria-label={`Remove ${item.name} from cart`} className="text-[#737373] hover:text-red-600 w-10 h-10 flex items-center justify-center">
                <IconTrash className="w-4 h-4" stroke={1.75} />
              </button>
            </div>
          </div>
        </div>
      ))}
          </div>

          <div>
            <div className="border border-[#e5e5e5] rounded-xl p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#737373]">Subtotal</span>
                <span className="font-mono">₦{total.toLocaleString()}</span>
              </div>
              <p className="text-xs text-[#737373] mb-4">Delivery calculated at checkout</p>
              <Link
                href={`/${slug}/checkout`}
                className="flex items-center justify-center w-full rounded-lg px-4 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}