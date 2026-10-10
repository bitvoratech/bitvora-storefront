import { createAdminClient } from '../../../lib/supabase/admin'
import { requireOwnerPage } from '../../../lib/auth/require-owner'
import { OwnerOrdersTable } from './OwnerOrdersTable'

export default async function OwnerOrdersPage() {
  await requireOwnerPage()
  const admin = createAdminClient()
  const { data: orders } = await admin
    .from('orders')
    .select('id, customer_name, customer_phone, total, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return <OwnerOrdersTable orders={orders ?? []} />
}