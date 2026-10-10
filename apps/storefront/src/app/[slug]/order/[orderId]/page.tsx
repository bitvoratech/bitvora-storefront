import { notFound } from 'next/navigation'
import { Check } from 'switch-icons'
import Link from 'next/link'
import { createClient } from '../../../../lib/supabase/server';
import { PaymentProofUpload } from './PaymentProofUpload'
import { getPublishedStore, whatsappLink } from '../../../../lib/store'
import { CopyButton } from '../../../../components/CopyButton'
import { BrandIcon } from '../../../../components/BrandIcon'

export const metadata = { title: 'Order placed', robots: { index: false } }

type OrderConfirmation = {
  id: string
  customer_name: string
  payment_method: 'bank_transfer' | 'pay_on_delivery'
  payment_proof_url: string | null
  delivery_method?: 'pickup' | 'delivery'
  delivery_area?: string | null
  delivery_fee: number
  total: number
  status: string
  order_items: { id: string; product_name: string; quantity: number; unit_price: number }[]
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>
}) {
  const { slug, orderId } = await params
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_order_confirmation', { p_order_id: orderId })
  const order = data as OrderConfirmation | null
  if (!order) notFound()

  const store = await getPublishedStore(slug)
  // Short, human-friendly reference; the full id is what the merchant sees too.
  const reference = order.id.slice(0, 8).toUpperCase()
  const contactSeller = whatsappLink(
    store?.social_links,
    `Hi ${store?.name ?? ''}, I just placed order #${reference} (₦${Number(order.total).toLocaleString()}).`
  )
  return (
    <div className="max-w-lg mx-auto text-center py-10">
      <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
        <Check className="w-7 h-7 text-green-600" />
      </div>
      <h1 className="text-2xl font-semibold mb-2">Order placed!</h1>
      <p className="text-[#737373] mb-8">
        Thanks {order.customer_name.split(' ')[0]}, we&apos;ve received your order.
        {order.payment_method === 'bank_transfer' && ' Please complete payment via bank transfer to confirm.'}
      </p>
      <div className="border border-[#e5e5e5] rounded-xl p-5 text-left space-y-2">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-[#525252]">{item.product_name} × {item.quantity}</span>
            <span className="font-mono">₦{(item.unit_price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-[#e5e5e5] pt-2 mt-2 flex justify-between gap-3 text-sm">
          <span className="text-[#737373]">
            {order.delivery_method === 'pickup' ? 'Pickup' : `Delivery${order.delivery_area ? ` · ${order.delivery_area}` : ''}`}
          </span>
          <span className="font-mono shrink-0">
            {Number(order.delivery_fee) === 0 ? 'Free' : `₦${Number(order.delivery_fee).toLocaleString()}`}
          </span>
        </div>
        <div className="flex justify-between font-medium pt-1">
          <span>Total</span>
          <span className="font-mono">₦{Number(order.total).toLocaleString()}</span>
        </div>
      </div>

      {order.delivery_method === 'pickup' && store?.pickup_address && (
        <div className="mt-4 rounded-xl bg-[#fafafa] p-4 text-left text-sm">
          <p className="font-medium mb-0.5">Pick up your order from</p>
          <p className="text-[#525252] whitespace-pre-line">{store.pickup_address}</p>
        </div>
      )}

      {order.payment_method === 'bank_transfer' && (
        <div className="mt-6 text-left">
          <p className="text-sm font-medium mb-2">Upload payment proof</p>
          <PaymentProofUpload
            orderId={order.id}
            slug={slug}
            existingProofUrl={order.payment_proof_url}
          />
        </div>
      )}

      <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#fafafa] px-3 py-2">
        <span className="text-xs text-[#737373]">Order reference</span>
        <span className="font-mono text-sm font-medium">#{reference}</span>
        <CopyButton value={reference} label="Copy order reference" />
      </div>
      <p className="text-xs text-[#737373] mt-2">Save this reference — the seller will use it to find your order.</p>

      {contactSeller && (
        <a
          href={contactSeller}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-center gap-2 w-full rounded-lg border border-[#e5e5e5] px-4 py-3 text-sm font-medium hover:bg-[#fafafa] transition-colors"
        >
          <BrandIcon icon="Whatsapp" className="w-4 h-4" />
          Message the seller on WhatsApp
        </a>
      )}
      <Link href={`/${slug}`} className="inline-block text-sm underline mt-6">
        Continue shopping
      </Link>
    </div>
  )
}