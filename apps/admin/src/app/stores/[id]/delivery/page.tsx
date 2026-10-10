import { notFound } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'
import { DeliverySettingsForm } from './DeliverySettingsForm'

export default async function DeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: store, error } = await supabase
    .from('stores')
    .select('id, name, pickup_enabled, pickup_address, delivery_note, free_delivery_min, pay_on_delivery_enabled, bank_name, account_number')
    .eq('id', id)
    .single()

  // PGRST116 = no row (not your store / doesn't exist). Anything else means
  // the query itself failed — most likely the delivery migration hasn't been
  // applied to this database yet — so say that instead of a misleading 404.
  if (error && error.code !== 'PGRST116') {
    console.error('Delivery settings query failed', error)
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl sm:text-2xl font-display font-semibold mb-1">Delivery & checkout</h1>
        <div role="alert" className="mt-4 rounded-lg bg-marigold-50 text-ink/80 text-sm px-4 py-3">
          Delivery settings aren&apos;t available yet — the database hasn&apos;t been updated for this feature.
          Please try again shortly.
        </div>
      </div>
    )
  }
  if (!store) notFound()

  const { data: zones } = await supabase
    .from('delivery_zones')
    .select('area, fee')
    .eq('store_id', id)
    .order('position')

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-display font-semibold mb-1">Delivery & checkout</h1>
      <p className="text-ink/50 text-sm mb-6">
        Where you deliver, what it costs, and how customers can pay at {store.name}.
      </p>

      <DeliverySettingsForm
        storeId={store.id}
        hasBankDetails={!!store.bank_name && !!store.account_number}
        initial={{
          pickupEnabled: store.pickup_enabled ?? true,
          pickupAddress: store.pickup_address ?? '',
          deliveryNote: store.delivery_note ?? '',
          freeDeliveryMin: store.free_delivery_min != null ? String(Number(store.free_delivery_min)) : '',
          payOnDeliveryEnabled: store.pay_on_delivery_enabled ?? true,
          zones: (zones ?? []).map((z) => ({ area: z.area, fee: String(Number(z.fee)) })),
        }}
      />
    </div>
  )
}
