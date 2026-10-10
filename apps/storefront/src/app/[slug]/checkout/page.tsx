'use client'

import { use, useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from './actions'
import { ArrowLeft, AlertTriangle, Upload, Check } from 'switch-icons'
import Link from 'next/link'
import { useCart } from '../../../lib/cart-store'
import { uploadToCloudinary } from '../../../lib/cloudinary-upload'
import { CopyButton } from '../../../components/CopyButton'
import { VerifiedBadge } from '../../../components/VerifiedBadge'

type DeliveryMethod = 'pickup' | 'delivery'
type PaymentMethod = 'bank_transfer' | 'pay_on_delivery'

// Shape returned by /api/store-id — the merchant's own checkout settings.
type CheckoutStore = {
  id: string
  bank_name: string | null
  account_number: string | null
  account_name: string | null
  pickup_enabled: boolean
  pickup_address: string | null
  delivery_note: string | null
  free_delivery_min: number | null
  pay_on_delivery_enabled: boolean
  is_verified: boolean
  delivery_zones: { area: string; fee: number }[]
}

const inputClass =
  'w-full rounded-lg border border-[#e5e5e5] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#171717]'

function OptionButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`rounded-lg border px-3 py-3 text-sm text-left ${
        selected ? 'border-[#171717] bg-[#fafafa] font-medium' : 'border-[#e5e5e5]'
      }`}
    >
      {children}
    </button>
  )
}

export default function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const { items, total, clear } = useCart(slug)

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const [store, setStore] = useState<CheckoutStore | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery')
  const [area, setArea] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/store-id?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: CheckoutStore) => {
        setStore(d)
        // Default to whatever this store actually offers.
        setDeliveryMethod(d.delivery_zones.length > 0 ? 'delivery' : 'pickup')
        setArea(d.delivery_zones[0]?.area ?? '')
        setPaymentMethod(d.account_number ? 'bank_transfer' : 'pay_on_delivery')
      })
      .catch(() => setError('This store is not taking orders right now. Please try again later.'))
  }, [slug])

  const zones = store?.delivery_zones ?? []
  const offersDelivery = zones.length > 0
  const offersPickup = !!store?.pickup_enabled
  const offersBankTransfer = !!store?.account_number
  const offersPayOnDelivery = !!store?.pay_on_delivery_enabled
  const canCheckout = !!store && (offersDelivery || offersPickup) && (offersBankTransfer || offersPayOnDelivery)

  const zoneFee = zones.find((z) => z.area === area)?.fee ?? 0
  const freeDeliveryApplies =
    deliveryMethod === 'delivery' && store?.free_delivery_min != null && total >= store.free_delivery_min
  // Display only — the server recomputes the fee from the store's zones.
  const deliveryFee = deliveryMethod === 'delivery' && !freeDeliveryApplies ? zoneFee : 0
  const grandTotal = total + deliveryFee
  const amountToFreeDelivery =
    deliveryMethod === 'delivery' && store?.free_delivery_min != null && !freeDeliveryApplies
      ? store.free_delivery_min - total
      : 0

  async function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingProof(true)
    try {
      const url = await uploadToCloudinary(file)
      setProofUrl(url)
    } catch {
      setError('Proof upload failed. Try again.')
    } finally {
      setUploadingProof(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!store || !canCheckout) return
    if (paymentMethod === 'bank_transfer' && !proofUrl) {
      setError('Please upload proof of payment before placing your order.')
      return
    }
    if (deliveryMethod === 'delivery' && !area) {
      setError('Choose a delivery area.')
      return
    }
    setLoading(true)
    setError(null)

    let result: Awaited<ReturnType<typeof createOrder>>
    try {
      result = await createOrder({
        storeId: store.id,
        storeSlug: slug,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        deliveryMethod,
        deliveryArea: deliveryMethod === 'delivery' ? area : undefined,
        paymentMethod,
        paymentProofUrl: paymentMethod === 'bank_transfer' ? proofUrl : undefined,
        items: items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity })),
      })
    } catch {
      setError('We couldn’t reach the store. Check your connection and try again.')
      setLoading(false)
      return
    }

    if (result.error || !result.orderId) {
      setError(result.error ?? 'Could not place your order. Please try again.')
      setLoading(false)
      return
    }

    // Clear before navigating — once we push, this component unmounts and
    // never gets a chance to run this again.
    clear()
    router.push(`/${slug}/order/${result.orderId}`)
  }

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[#737373]">Your cart is empty.</p>
        <Link href={`/${slug}`} className="text-sm mt-2 inline-block underline">Browse products</Link>
      </div>
    )
  }

  return (
    <div>
      <Link href={`/${slug}/cart`} className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#171717] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to cart
      </Link>

      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      <div className="grid gap-8 sm:grid-cols-3">
        <form onSubmit={handleSubmit} className="sm:col-span-2 space-y-5">
          {error && (
            <div role="alert" className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {store && !canCheckout && (
            <div role="alert" className="flex items-start gap-2 bg-amber-50 text-amber-900 text-sm rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              This store hasn&apos;t finished setting up checkout yet. Please contact the seller to order.
            </div>
          )}

          <div>
            <label htmlFor="checkout-name" className="block text-sm font-medium mb-1.5">Full name</label>
            <input id="checkout-name" required autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="checkout-phone" className="block text-sm font-medium mb-1.5">Phone number</label>
            <input id="checkout-phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="080..." maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="checkout-email" className="block text-sm font-medium mb-1.5">Email <span className="font-normal text-[#737373]">(optional)</span></label>
            <input id="checkout-email" type="email" autoComplete="email" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>

          {(offersDelivery || offersPickup) && (
            <div>
              <p id="delivery-method-label" className="block text-sm font-medium mb-2">How do you want to get your order?</p>
              <div className={`grid gap-2 ${offersDelivery && offersPickup ? 'grid-cols-2' : 'grid-cols-1'}`} role="radiogroup" aria-labelledby="delivery-method-label">
                {offersDelivery && (
                  <OptionButton selected={deliveryMethod === 'delivery'} onClick={() => setDeliveryMethod('delivery')}>
                    Delivery
                  </OptionButton>
                )}
                {offersPickup && (
                  <OptionButton selected={deliveryMethod === 'pickup'} onClick={() => setDeliveryMethod('pickup')}>
                    Pickup <span className="text-[#737373] font-normal">· free</span>
                  </OptionButton>
                )}
              </div>
            </div>
          )}

          {deliveryMethod === 'delivery' && offersDelivery && (
            <div>
              <label htmlFor="checkout-area" className="block text-sm font-medium mb-1.5">Delivery area</label>
              <select id="checkout-area" value={area} onChange={(e) => setArea(e.target.value)} className={inputClass}>
                {zones.map((z) => (
                  <option key={z.area} value={z.area}>
                    {z.area} — {z.fee === 0 ? 'Free' : `₦${z.fee.toLocaleString()}`}
                  </option>
                ))}
              </select>
              {freeDeliveryApplies && (
                <p className="text-xs text-green-700 mt-1.5">Free delivery applied to this order.</p>
              )}
              {amountToFreeDelivery > 0 && (
                <p className="text-xs text-[#525252] mt-1.5">
                  Add ₦{amountToFreeDelivery.toLocaleString()} more to get free delivery.
                </p>
              )}
              {store?.delivery_note && (
                <p className="text-xs text-[#525252] mt-1.5 whitespace-pre-line">{store.delivery_note}</p>
              )}
            </div>
          )}

          {deliveryMethod === 'pickup' && offersPickup && store?.pickup_address && (
            <div className="rounded-lg bg-[#fafafa] px-3 py-2.5 text-sm">
              <p className="font-medium mb-0.5">Pickup from</p>
              <p className="text-[#525252] whitespace-pre-line">{store.pickup_address}</p>
            </div>
          )}

          {(offersBankTransfer || offersPayOnDelivery) && (
            <div>
              <p id="payment-method-label" className="block text-sm font-medium mb-2">Payment method</p>
              <div className={`grid gap-2 ${offersBankTransfer && offersPayOnDelivery ? 'grid-cols-2' : 'grid-cols-1'}`} role="radiogroup" aria-labelledby="payment-method-label">
                {offersBankTransfer && (
                  <OptionButton selected={paymentMethod === 'bank_transfer'} onClick={() => setPaymentMethod('bank_transfer')}>
                    Bank transfer
                  </OptionButton>
                )}
                {offersPayOnDelivery && (
                  <OptionButton selected={paymentMethod === 'pay_on_delivery'} onClick={() => setPaymentMethod('pay_on_delivery')}>
                    {deliveryMethod === 'pickup' ? 'Pay at pickup' : 'Pay on delivery'}
                  </OptionButton>
                )}
              </div>
            </div>
          )}

          {paymentMethod === 'bank_transfer' && offersBankTransfer && store && (
            <div className="rounded-lg border border-[#e5e5e5] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Send payment to:</p>
                {store.is_verified && <VerifiedBadge variant="inline" />}
              </div>
              <div className="text-sm space-y-1">
                <p>{store.bank_name}</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-base tracking-wide">{store.account_number}</p>
                  <CopyButton value={store.account_number ?? ''} label="Copy account number" />
                </div>
                <p className="text-[#737373]">{store.account_name}</p>
                <p className="pt-1 text-[#525252]">
                  Amount: <span className="font-mono font-medium text-[#171717]">₦{grandTotal.toLocaleString()}</span>
                </p>
              </div>

              <div className="pt-2">
                {proofUrl ? (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2.5">
                    <Check className="w-4 h-4 shrink-0" />
                    Payment proof uploaded
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 border border-dashed border-[#e5e5e5] rounded-lg px-3 py-3 text-sm text-[#737373] cursor-pointer hover:border-[#171717] hover:text-[#171717] transition-colors">
                    <Upload className="w-4 h-4" />
                    {uploadingProof ? 'Uploading…' : 'Upload a screenshot of your transfer (required)'}
                    <input type="file" accept="image/*" onChange={handleProofUpload} disabled={uploadingProof} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !canCheckout || (paymentMethod === 'bank_transfer' && !proofUrl)}
            className="w-full rounded-lg px-4 py-3.5 text-sm font-medium bg-[#171717] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Placing order…' : `Place order · ₦${grandTotal.toLocaleString()}`}
          </button>
        </form>

        <div>
          <div className="border border-[#e5e5e5] rounded-xl p-5 space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between gap-3 text-sm">
                <span className="text-[#525252]">{item.name} × {item.quantity}</span>
                <span className="font-mono shrink-0">₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-[#e5e5e5] pt-2 mt-2 flex justify-between text-sm">
              <span className="text-[#737373]">{deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</span>
              <span className="font-mono">{deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between font-medium pt-1">
              <span>Total</span>
              <span className="font-mono">₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
