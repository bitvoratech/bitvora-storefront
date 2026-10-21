import { createAdminClient } from '../../../lib/supabase/admin'
import { requireStaffPage } from '../../../lib/auth/require-owner'
import { OwnerStoresTable } from './OwnerStoresTable'

export default async function OwnerStoresPage() {
  await requireStaffPage()
  const admin = createAdminClient()
  const { data: stores } = await admin
    .from('stores')
    .select('id, name, slug, industry, is_published, created_at')
    .order('created_at', { ascending: false })

  return <OwnerStoresTable stores={stores ?? []} />
}