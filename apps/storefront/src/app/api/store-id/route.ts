import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { rateLimit } from '@bitvora/lib/rate-limit'
import { getPublishedStore } from '../../../lib/store'

// Everything the checkout page needs about a store: where to send payment and
// the merchant's own delivery/pickup/payment settings.
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const rl = await rateLimit('store-id', ip, 60, '1 m')
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const supabase = await createClient()
  const { data: store } = await supabase
    .from('stores')
    .select(`
      id, bank_name, account_number, account_name,
      pickup_enabled, pickup_address, delivery_note, free_delivery_min, pay_on_delivery_enabled,
      delivery_zones(area, fee, position)
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .order('position', { referencedTable: 'delivery_zones' })
    .maybeSingle()

  if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const publicStore = await getPublishedStore(slug)

  return NextResponse.json({
    ...store,
    delivery_zones: (store.delivery_zones ?? []).map((z: { area: string; fee: number }) => ({
      area: z.area,
      fee: Number(z.fee),
    })),
    free_delivery_min: store.free_delivery_min != null ? Number(store.free_delivery_min) : null,
    is_verified: !!publicStore?.is_verified,
  })
}
