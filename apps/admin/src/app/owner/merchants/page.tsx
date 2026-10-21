import { createAdminClient } from '../../../lib/supabase/admin'
import { requireStaffPage } from '../../../lib/auth/require-owner'
import { MerchantsTable } from './MerchantsTable'
import { planLabel } from '../../../lib/plans'

export default async function OwnerMerchantsPage() {
  await requireStaffPage()
  const admin = createAdminClient()
  const { data: merchants } = await admin
    .from('merchants')
    .select('id, full_name, business_name, phone, is_suspended, created_at')
    .eq('is_owner', false)
    .eq('is_admin', false)
    .order('created_at', { ascending: false })

  // Separate query so the list still loads if the plan columns are missing.
  const { data: plans } = await admin.from('merchants').select('id, plan, plan_interval').not('plan', 'is', null)
  const planById = new Map((plans ?? []).map((p) => [p.id, planLabel(p.plan, p.plan_interval)]))

  return <MerchantsTable merchants={(merchants ?? []).map((m) => ({ ...m, plan: planById.get(m.id) ?? null }))} />
}