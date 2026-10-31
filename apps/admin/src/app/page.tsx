import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card } from '@bitvora/ui/src/Card'
import { KpiCard } from '@bitvora/ui/src/KpiCard'
import { Button } from '@bitvora/ui/src/Button'
import { createClient } from '../lib/supabase/server'
import { IconChevronRight, IconPlus } from '@tabler/icons-react'
import { StoresGrid } from './StoresGrid'
import { VerificationStatusCard } from './VerificationStatusCard'
import { PayForPlanCard } from './PayForPlanCard'
import { hasActivePlan, planLabel, storeLimitMessage, underStoreLimit } from '../lib/plans'
import { UpgradeGate } from '../components/UpgradeGate'
import { canOpenStore, complianceOverdue } from '../lib/merchant-identity'


export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, full_name, is_owner, is_admin, verification_status, phone_verified_at, nin, cac_number, verification_note, compliance_due_at, plan, plan_interval, subscription_status, current_period_end')
    .eq('user_id', user.id)
    .single()

  // The owner and admins don't run stores; their home is the console.
  if (merchant?.is_owner || merchant?.is_admin) redirect('/owner')

  // New merchants haven't confirmed their phone yet: take them to the OTP
  // step rather than an empty dashboard they can't do anything from.
  if (merchant && !canOpenStore(merchant)) {
    redirect('/verify')
  }

  // Payment comes straight after the phone at signup: anyone who has never
  // paid (no subscription status at all) finishes that before the dashboard.
  if (merchant && !merchant.subscription_status) {
    redirect('/billing')
  }

  // NIN/CAC compliance is optional: it earns the Verified seller badge, and
  // until it's approved the dashboard keeps a card nudging them to finish it.
  const isVerified = merchant?.verification_status === 'verified'
  // With the phone verified, a store only needs the plan paid for.
  const canCreateStore = hasActivePlan(merchant)

  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .eq('merchant_id', merchant?.id)
    .order('created_at', { ascending: false })

  const storeRows = stores ?? []
  const storeIds = storeRows.map((s) => s.id)

  const { data: orders } = storeIds.length
    ? await supabase.from('orders').select('store_id, total, status, created_at').in('store_id', storeIds)
    : { data: [] }

  const orderRows = orders ?? []
  const activeOrders = orderRows.filter((o) => o.status !== 'cancelled')

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000)

  const enrichedStores = storeRows.map((store) => {
    const storeOrders = activeOrders.filter(
      (o) => o.store_id === store.id && new Date(o.created_at) >= sevenDaysAgo
    )
    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      industry: store.industry,
      is_published: store.is_published,
      ordersThisWeek: storeOrders.length,
      pendingOrders: orderRows.filter((o) => o.store_id === store.id && o.status === 'pending').length,
      revenueThisWeek: storeOrders.reduce((sum, o) => sum + Number(o.total), 0),
    }
  })

  const liveCount = storeRows.filter((s) => s.is_published).length
  const combinedRevenueThisWeek = enrichedStores.reduce((sum, s) => sum + s.revenueThisWeek, 0)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
        <h1 className="min-w-0 truncate text-xl sm:text-3xl font-display font-semibold tracking-tight">
          {merchant?.full_name ? `Welcome back, ${merchant.full_name.split(' ')[0]}` : 'Your stores'}
        </h1>
        {canCreateStore && (
          <UpgradeGate
            href="/stores/new"
            locked={!underStoreLimit(merchant?.plan, storeRows.length)}
            title="Upgrade to add another store"
            message={storeLimitMessage(merchant?.plan)}
            className="shrink-0"
          >
            <Button className="gap-1.5">
              <IconPlus className="w-4 h-4" />
              New store
            </Button>
          </UpgradeGate>
        )}
      </div>

      {!isVerified && (
        <div className="mb-6">
          <VerificationStatusCard
            status={merchant?.verification_status === 'failed' ? 'rejected' : merchant?.nin && merchant?.cac_number && merchant?.verification_status === 'pending' ? 'in_review' : 'details_needed'}
            note={merchant?.verification_note ?? null}
            dueAt={merchant?.compliance_due_at ?? null}
            overdue={complianceOverdue(merchant)}
          />
        </div>
      )}

      {!canCreateStore && storeRows.length === 0 ? (
        <PayForPlanCard plan={planLabel(merchant?.plan, merchant?.plan_interval)} lapsed={!!merchant?.subscription_status} />
      ) : storeRows.length === 0 ? (
        <Card className="text-center py-14 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, var(--color-indigo-900) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          <p className="relative text-ink/60 mb-3">You haven&apos;t created a store yet.</p>
          <Link href="/stores/new" className="relative text-indigo-600 font-medium">
            Create your first store <IconChevronRight className="w-4 h-4 inline-block ml-1 -mt-0.5" />
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
            <KpiCard label="Total stores" value={storeRows.length.toLocaleString()} />
            <KpiCard label="Live" value={liveCount.toLocaleString()} />
            <KpiCard label="Revenue · this week" value={`₦${combinedRevenueThisWeek.toLocaleString()}`} />
          </div>

          {!canCreateStore && (
            <div className="mb-6">
              <PayForPlanCard plan={planLabel(merchant?.plan, merchant?.plan_interval)} lapsed />
            </div>
          )}
          <StoresGrid stores={enrichedStores} />
        </>
      )}
    </div>
  )
}