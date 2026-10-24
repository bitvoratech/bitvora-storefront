'use server'

import { createAdminClient } from '../../../lib/supabase/admin'
import { getClientIp, rateLimit } from '@bitvora/lib/rate-limit'
import { isPaymentProofUrl } from '../../../lib/cloudinary-url'

type CheckoutInput = {
  storeId: string
  storeSlug: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  deliveryMethod: 'pickup' | 'delivery'
  deliveryArea?: string
  deliveryAddress?: string
  paymentMethod: 'bank_transfer' | 'pay_on_delivery'
  paymentProofUrl?: string
  items: { productId: string; name: string; price: number; quantity: number; size?: string }[]
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Messages raised by create_order that are safe and useful to show customers.
// Anything else (driver/DB errors) is replaced with a generic message.
const CUSTOMER_FACING_DB_ERRORS = [
  'Store is not available',
  'Name and phone number are required',
  'Proof of payment is required',
  'Your cart is empty',
  'Too many items',
  'Invalid item quantity',
  'One or more items are no longer available',
  'does not offer pickup',
  'does not deliver to that area',
  'does not accept pay on delivery',
  'out of stock',
  'left in stock',
  'Choose a size',
  'no longer comes in size',
]

// The create_order RPC is only executable by the service role, so this
// action is the single path for creating orders: it rate-limits and
// validates. The RPC then derives the delivery fee from the merchant's own
// delivery zones, recomputes prices from live product rows and enforces
// stock — so name/price in `items` are only used for optimistic UI.
export async function createOrder(input: CheckoutInput) {
  const rl = await rateLimit('order', await getClientIp(), 5, '10 m')
  if (!rl.ok) return { error: 'Too many orders from this device. Try again in a few minutes.' }

  const customerName = (input.customerName ?? '').trim()
  const customerPhone = (input.customerPhone ?? '').trim()
  const customerEmail = (input.customerEmail ?? '').trim()

  if (typeof input.storeId !== 'string' || !UUID_RE.test(input.storeId)) {
    return { error: 'Store is not available.' }
  }
  if (customerName.length < 2 || customerName.length > 100) {
    return { error: 'Enter your full name.' }
  }
  if (!/^\+?[0-9\s()-]{7,20}$/.test(customerPhone)) {
    return { error: 'Enter a valid phone number.' }
  }
  if (customerEmail && (customerEmail.length > 200 || !EMAIL_RE.test(customerEmail))) {
    return { error: 'Enter a valid email address, or leave it blank.' }
  }
  if (input.deliveryMethod !== 'pickup' && input.deliveryMethod !== 'delivery') {
    return { error: 'Choose pickup or delivery.' }
  }
  if (input.paymentMethod !== 'bank_transfer' && input.paymentMethod !== 'pay_on_delivery') {
    return { error: 'Choose a payment method.' }
  }

  let deliveryArea: string | null = null
  let deliveryAddress: string | null = null
  if (input.deliveryMethod === 'delivery') {
    deliveryArea = (input.deliveryArea ?? '').trim()
    if (!deliveryArea || deliveryArea.length > 80) return { error: 'Choose a delivery area.' }
    deliveryAddress = (input.deliveryAddress ?? '').trim().replace(/\s+\n/g, '\n')
    if (deliveryAddress.length < 5) return { error: 'Enter the address to deliver to.' }
    if (deliveryAddress.length > 300) return { error: 'Keep the delivery address under 300 characters.' }
  }

  let paymentProofUrl: string | null = null
  if (input.paymentMethod === 'bank_transfer') {
    if (!input.paymentProofUrl || !isPaymentProofUrl(input.paymentProofUrl)) {
      return { error: 'Please upload proof of payment before placing your order.' }
    }
    paymentProofUrl = input.paymentProofUrl
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { error: 'Your cart is empty.' }
  }
  if (input.items.length > 100) {
    return { error: 'Too many items in one order.' }
  }
  for (const item of input.items) {
    if (
      typeof item?.productId !== 'string' ||
      !UUID_RE.test(item.productId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 999 ||
      (item.size != null && (typeof item.size !== 'string' || item.size.length > 40))
    ) {
      return { error: 'Your cart has an invalid item. Remove it and try again.' }
    }
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('create_order', {
    p_store_id: input.storeId,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_customer_email: customerEmail || null,
    p_delivery_method: input.deliveryMethod,
    p_delivery_area: deliveryArea,
    p_delivery_fee: 0, // ignored: computed from the store's delivery zones
    p_payment_method: input.paymentMethod,
    p_payment_proof_url: paymentProofUrl,
    p_items: input.items.map((i) => ({ productId: i.productId, quantity: i.quantity, size: i.size || null })),
  })

  if (error || !data) {
    const message = error?.message ?? ''
    if (CUSTOMER_FACING_DB_ERRORS.some((m) => message.includes(m))) {
      return { error: message }
    }
    console.error('create_order failed', error)
    return { error: 'Could not place your order. Please try again.' }
  }

  if (deliveryAddress) {
    // create_order predates addresses, so the address is saved on the new
    // order straight after. A failure here shouldn't lose the order itself.
    const { error: addressError } = await supabase
      .from('orders')
      .update({ delivery_address: deliveryAddress })
      .eq('id', data.order_id)
    if (addressError) console.error('saving delivery address failed', addressError)
  }

  // No redirect() here — the caller (checkout page) clears the cart first,
  // then navigates. Redirecting inside the action would cut off the
  // client's code right after the await, before clear() ever runs.
  return { orderId: data.order_id as string }
}
