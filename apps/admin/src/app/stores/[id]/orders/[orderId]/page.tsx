import { notFound } from 'next/navigation'
import { Card } from '@bitvora/ui/src/Card'
import Link from 'next/link'
import { ArrowLeft } from 'switch-icons'
import { IconPhone, IconBrandWhatsapp } from '@tabler/icons-react'
import { StatusBadge } from '../StatusBadge'
import { createClient } from '../../../../../lib/supabase/server'
import { cldImage } from '@bitvora/lib/cloudinary-image'
import { StatusSelector } from './StatusSelector'

/** International digits for wa.me / tel: links; accepts 080…, +234…, 234…. */
function toInternationalPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('234')) return digits
  if (digits.startsWith('0')) return `234${digits.slice(1)}`
  return digits
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; orderId: string }>
}) {
  const { id: storeId, orderId } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*), stores(name)')
    .eq('id', orderId)
    .eq('store_id', storeId)
    .single()

  if (!order) notFound()

  // Same short reference the customer sees on their confirmation page.
  const reference = String(order.id).slice(0, 8).toUpperCase()
  const phone = toInternationalPhone(order.customer_phone)
  const storeName = (order.stores as { name?: string } | null)?.name ?? 'our store'
  const firstName = String(order.customer_name).split(' ')[0]
  const whatsappHref = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${firstName}, this is ${storeName} about your order #${reference}.`)}`
    : null
  const placedAt = new Date(order.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div>
      <Link href={`/stores/${storeId}/orders`} className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </Link>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0">
            <h1 className="text-2xl font-display font-semibold truncate">{order.customer_name}</h1>
            <p className="text-xs text-ink/50 mt-0.5">
              Order <span className="font-mono">#{reference}</span> · {placedAt}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3 mb-6">
          <span className="text-ink/60 font-mono text-sm mr-1">
            {order.customer_phone}
            {order.customer_email ? ` · ${order.customer_email}` : ''}
          </span>
          {phone && (
            <a
              href={`tel:+${phone}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium bg-sand-100 text-ink hover:bg-sand-200 border border-sand-200 transition-colors"
            >
              <IconPhone className="w-4 h-4" stroke={1.75} /> Call
            </a>
          )}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium bg-palm-50 text-palm-600 hover:opacity-90 transition-opacity"
            >
              <IconBrandWhatsapp className="w-4 h-4" stroke={1.75} /> WhatsApp
            </a>
          )}
        </div>

        <Card className="mb-4">
          <p className="text-sm font-medium mb-3">Update status</p>
          <StatusSelector orderId={order.id} storeId={storeId} currentStatus={order.status} />
        </Card>

        <Card className="mb-4">
          <p className="text-sm font-medium mb-3">Delivery & payment</p>
          <p className="text-sm text-ink/70 capitalize">
            {order.delivery_method}
            {order.delivery_area && ` · ${order.delivery_area}`}
          </p>
          <p className="text-sm text-ink/50 mt-1 capitalize">
            Payment: {String(order.payment_method).replaceAll('_', ' ')}
          </p>
          {order.payment_method === 'bank_transfer' && (
            order.payment_proof_url ? (
              <a
                href={order.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block w-fit group"
                aria-label="Open payment proof in a new tab"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cldImage(order.payment_proof_url, 640)}
                  alt="Customer's payment proof"
                  loading="lazy"
                  className="max-h-80 w-auto rounded-lg border border-sand-200 group-hover:border-indigo-600 transition-colors"
                />
                <span className="text-xs text-indigo-600 mt-1.5 inline-block">Open full size ↗</span>
              </a>
            ) : (
              <p className="text-sm text-marigold-500 mt-2">No payment proof uploaded yet.</p>
            )
          )}
        </Card>

        <Card>
          <p className="text-sm font-medium mb-3">Items</p>
          <div className="space-y-2">
            {order.order_items.map((item: { id: string; product_name: string; quantity: number; unit_price: number }) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="text-ink/70">{item.product_name} × {item.quantity}</span>
                <span className="font-mono shrink-0">₦{(item.unit_price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-sand-200 pt-2 mt-2 flex justify-between text-sm">
              <span className="text-ink/50">Delivery</span>
              <span className="font-mono">₦{Number(order.delivery_fee).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium pt-1">
              <span>Total</span>
              <span className="font-mono">₦{Number(order.total).toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
