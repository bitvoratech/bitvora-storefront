import { createClient } from '../../../../lib/supabase/server'
import { OrdersTable } from './OrdersTable'

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { id: storeId } = await params
  const { status } = await searchParams
  const initialStatus = status && STATUSES.includes(status) ? status : 'all'
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_name, customer_phone, total, status, created_at, payment_method, payment_proof_url')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-display font-semibold mb-1">Orders</h1>
      <p className="text-ink/50 text-sm mb-6">
        {orders?.length ?? 0} order{orders?.length === 1 ? '' : 's'}
      </p>

      <OrdersTable storeId={storeId} orders={orders ?? []} initialStatus={initialStatus} />
    </div>
  )
}