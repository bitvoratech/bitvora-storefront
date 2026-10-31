'use server'

import { createAdminClient } from '../../../../lib/supabase/admin'
import { getClientIp, rateLimit } from '@bitvora/lib/rate-limit'
import { getPublishedStore } from '../../../../lib/store'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// "Tell me when it's back": stores the shopper's WhatsApp number against a
// sold-out product so the merchant can message them when it's restocked.
// Shoppers can't write this table directly; this action is the only way in.
export async function requestRestockAlert(slug: string, productId: string, name: string, phone: string) {
  const rl = await rateLimit('restock', await getClientIp(), 5, '10 m')
  if (!rl.ok) return { error: 'Too many requests. Try again in a few minutes.' }

  const customerName = (name ?? '').trim().slice(0, 100)
  const customerPhone = (phone ?? '').trim()
  if (!/^\+?[0-9\s()-]{7,20}$/.test(customerPhone)) return { error: 'Enter a valid WhatsApp number.' }
  if (typeof productId !== 'string' || !UUID_RE.test(productId)) return { error: 'Product not found.' }

  const store = await getPublishedStore(slug)
  if (!store) return { error: 'This store is not available.' }

  const supabase = createAdminClient()
  const { data: product } = await supabase
    .from('products')
    .select('id, stock_quantity, track_stock')
    .eq('id', productId)
    .eq('store_id', store.id)
    .eq('is_active', true)
    .maybeSingle()
  if (!product) return { error: 'Product not found.' }
  if (product.track_stock === false || (product.stock_quantity ?? 0) > 0) return { error: 'Good news — this is back in stock. Refresh the page to order.' }

  const { error } = await supabase.from('restock_requests').insert({
    store_id: store.id,
    product_id: product.id,
    customer_name: customerName || null,
    customer_phone: customerPhone,
  })

  // 23505: already on the list for this product — that's a success for the shopper.
  if (error && error.code !== '23505') {
    console.error('restock request failed', error)
    return { error: 'Could not save your request. Try again.' }
  }
  return { ok: true as const }
}
