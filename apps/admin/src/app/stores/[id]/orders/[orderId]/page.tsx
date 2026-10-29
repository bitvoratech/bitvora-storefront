import { notFound } from 'next/navigation'
import { Card } from '@bitvora/ui/src/Card'
import Link from 'next/link'
import { ArrowLeft, PackageBox } from 'switch-icons'
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
    .select('*, order_items(*, products(images)), stores(name)')
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

  type Item = {
    id: string
    product_name: string
    size: string | null
    quantity: number
    unit_price: number
    products: { images: string[] | null } | null
  }
  const items = (order.order_items ?? []) as unknown as Item[]
  const itemCount = items.reduce((n, item) => n + item.quantity, 0)
  const subtotal = items.reduce((n, item) => n + item.unit_price * item.quantity, 0)
  const naira = (n: number) => `₦${Number(n).toLocaleString()}`

  // Room for the next-step bar StatusSelector pins to the bottom on phones.
  const hasNextStep = ['pending', 'confirmed', 'shipped'].includes(order.status)

  return (
    <div className={hasNextStep ? 'pb-20 sm:pb-0' : ''}>
      <Link href={`/stores/${storeId}/orders`} className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </Link>
      <div className="max-w-5xl">
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-semibold truncate">{order.customer_name}</h1>
            <p className="text-sm text-ink/60 mt-0.5">
              <span className="font-mono font-medium text-ink">{naira(order.total)}</span> · {itemCount} item{itemCount === 1 ? '' : 's'}
            </p>
            <p className="text-xs text-ink/50 mt-0.5">
              Order <span className="font-mono">#{reference}</span> · {placedAt}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Phone: status first, since that's what a merchant opens an order to change.
            Desktop: items on the left, status and customer on the right. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="space-y-4 min-w-0 order-2 lg:order-1">
            <Card>
              <p className="text-sm font-medium mb-3">Items</p>
              <ul className="divide-y divide-sand-200">
                {items.map((item) => {
                  const image = item.products?.images?.[0]
                  return (
                    <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cldImage(image, 120)} alt="" loading="lazy" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-sand-100 flex items-center justify-center shrink-0">
                          <PackageBox className="w-4 h-4 text-ink/20" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{item.product_name}</p>
                        <p className="text-xs text-ink/50 mt-0.5">
                          {item.size && <span className="mr-1.5 rounded bg-sand-100 px-1.5 py-0.5 font-medium text-ink">Size {item.size}</span>}
                          <span className="font-mono">{item.quantity} × {naira(item.unit_price)}</span>
                        </p>
                      </div>
                      <span className="font-mono text-sm shrink-0">{naira(item.unit_price * item.quantity)}</span>
                    </li>
                  )
                })}
              </ul>
              <dl className="border-t border-sand-200 pt-3 mt-1 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink/50">Subtotal</dt>
                  <dd className="font-mono">{naira(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/50">Delivery</dt>
                  <dd className="font-mono">{naira(order.delivery_fee)}</dd>
                </div>
                <div className="flex justify-between font-medium pt-1">
                  <dt>Total</dt>
                  <dd className="font-mono">{naira(order.total)}</dd>
                </div>
              </dl>
            </Card>

            <Card>
              <p className="text-sm font-medium mb-3">Delivery & payment</p>
              <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-sm">
                <dt className="text-ink/50">Delivery</dt>
                <dd className="capitalize">
                  {order.delivery_method}
                  {order.delivery_area && ` · ${order.delivery_area}`}
                </dd>
                {order.delivery_address && (
                  <>
                    <dt className="text-ink/50">Address</dt>
                    <dd className="whitespace-pre-line">{order.delivery_address}</dd>
                  </>
                )}
                <dt className="text-ink/50">Payment</dt>
                <dd className="capitalize">{String(order.payment_method).replaceAll('_', ' ')}</dd>
              </dl>
              {order.payment_method === 'bank_transfer' && (
                order.payment_proof_url ? (
                  <a
                    href={order.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block w-fit max-w-full group"
                    aria-label="Open payment proof in a new tab"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cldImage(order.payment_proof_url, 640)}
                      alt="Customer's payment proof"
                      loading="lazy"
                      className="max-h-80 max-w-full w-auto rounded-lg border border-sand-200 group-hover:border-indigo-600 transition-colors"
                    />
                    <span className="text-xs text-indigo-600 mt-1.5 inline-block">Open full size ↗</span>
                  </a>
                ) : (
                  <p className="text-sm text-marigold-500 mt-3">No payment proof uploaded yet.</p>
                )
              )}
            </Card>
          </div>

          <div className="space-y-4 min-w-0 order-1 lg:order-2 lg:sticky lg:top-20">
            <Card>
              <p className="text-sm font-medium mb-3">Status</p>
              <StatusSelector orderId={order.id} storeId={storeId} currentStatus={order.status} />
            </Card>

            <Card>
              <p className="text-sm font-medium mb-3">Customer</p>
              <p className="text-sm font-medium truncate">{order.customer_name}</p>
              <p className="text-sm text-ink/60 font-mono mt-0.5">{order.customer_phone}</p>
              {order.customer_email && (
                <a href={`mailto:${order.customer_email}`} className="block text-sm text-ink/60 hover:text-indigo-600 truncate mt-0.5">
                  {order.customer_email}
                </a>
              )}
              {phone && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <a
                    href={`tel:+${phone}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium bg-sand-100 text-ink hover:bg-sand-200 border border-sand-200 transition-colors"
                  >
                    <IconPhone className="w-4 h-4" stroke={1.75} /> Call
                  </a>
                  {whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium bg-palm-50 text-palm-600 hover:opacity-90 transition-opacity"
                    >
                      <IconBrandWhatsapp className="w-4 h-4" stroke={1.75} /> WhatsApp
                    </a>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
