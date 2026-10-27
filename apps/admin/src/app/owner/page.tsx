import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { KpiCard } from '@bitvora/ui/src/KpiCard'
import { createAdminClient } from '../../lib/supabase/admin';
import { computeTrend } from '../../lib/computeTrend'
import { Sparkline } from './SparkLine';
import { requireStaffPage } from '../../lib/auth/require-owner'


function rangeCount(rows: { created_at: string }[], start: Date, end: Date) {
  return rows.filter((r) => {
    const t = new Date(r.created_at)
    return t >= start && t < end
  }).length
}

export default async function OwnerOverviewPage() {
  const { role } = await requireStaffPage()
  const admin = createAdminClient()

  // Owner and admin accounts aren't merchants, so leave them out of the counts.
  const { data: merchants } = await admin
    .from('merchants')
    .select('id, created_at, is_suspended, verification_status, phone_verified_at, nin, cac_number')
    .eq('is_owner', false)
    .eq('is_admin', false)
  const { data: stores } = await admin.from('stores').select('id, is_published, created_at')
  const { data: allOrders } = await admin.from('orders').select('id, total, status, created_at')
  const { count: transfersToCheck } = await admin.from('plan_transfers').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  const { count: adminCount } = role === 'owner'
    ? await admin.from('merchants').select('id', { count: 'exact', head: true }).eq('is_admin', true)
    : { count: null }

  const merchantRows = merchants ?? []
  const storeRows = stores ?? []
  const orders = allOrders ?? []

  const activeOrders = orders.filter((o) => o.status !== 'cancelled')
  const totalGMV = activeOrders.reduce((sum, o) => sum + Number(o.total), 0)
  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const publishedCount = storeRows.filter((s) => s.is_published).length
  // Same filter as the Verifications queue.
  const awaitingReview = merchantRows.filter(
    (m) => m.verification_status === 'pending' && m.phone_verified_at && m.nin && m.cac_number
  ).length
  const suspendedCount = merchantRows.filter((m) => m.is_suspended).length

  const attention = [
    { href: '/owner/verifications', label: 'Verifications to review', value: awaitingReview, urgent: awaitingReview > 0 },
    { href: '/owner/payments', label: 'Bank transfers to check', value: transfersToCheck ?? 0, urgent: (transfersToCheck ?? 0) > 0 },
    { href: '/owner/merchants', label: 'Suspended merchants', value: suspendedCount, urgent: false },
    ...(role === 'owner' ? [{ href: '/owner/admins', label: 'Admins', value: adminCount ?? 0, urgent: false }] : []),
  ]

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(startOfToday.getTime() - 14 * 24 * 60 * 60 * 1000)

  const merchantsTrend = computeTrend(
    rangeCount(merchantRows, sevenDaysAgo, now),
    rangeCount(merchantRows, fourteenDaysAgo, sevenDaysAgo),
    'vs last week'
  )
  const storesTrend = computeTrend(
    rangeCount(storeRows, sevenDaysAgo, now),
    rangeCount(storeRows, fourteenDaysAgo, sevenDaysAgo),
    'vs last week'
  )
  const ordersTrend = computeTrend(
    rangeCount(orders, sevenDaysAgo, now),
    rangeCount(orders, fourteenDaysAgo, sevenDaysAgo),
    'vs last week'
  )

  const gmvThisWeek = activeOrders
    .filter((o) => {
      const t = new Date(o.created_at)
      return t >= sevenDaysAgo && t < now
    })
    .reduce((sum, o) => sum + Number(o.total), 0)
  const gmvLastWeek = activeOrders
    .filter((o) => {
      const t = new Date(o.created_at)
      return t >= fourteenDaysAgo && t < sevenDaysAgo
    })
    .reduce((sum, o) => sum + Number(o.total), 0)
  const gmvTrend = computeTrend(gmvThisWeek, gmvLastWeek, 'vs last week')

  const gmvSpark = Array.from({ length: 14 }).map((_, i) => {
    const dayStart = new Date(startOfToday.getTime() - (13 - i) * 24 * 60 * 60 * 1000)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    return activeOrders
      .filter((o) => {
        const t = new Date(o.created_at)
        return t >= dayStart && t < dayEnd
      })
      .reduce((sum, o) => sum + Number(o.total), 0)
  })

  const { data: recentStores } = await admin
    .from('stores')
    .select('id, name, slug, industry, is_published, created_at, merchant_id, merchants!inner(is_owner)')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div>
      <div className={`grid grid-cols-1 gap-3 mb-8 ${attention.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : attention.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {attention.map((item) => (
          <Link key={item.href} href={item.href} className="block rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
            <Card className={`p-4 h-full transition-colors hover:bg-sand-100/60 ${item.urgent ? 'ring-1 ring-marigold-500' : ''}`}>
              <p className="text-xs text-ink/50 font-medium mb-1.5">{item.label}</p>
              <p className="font-display text-xl sm:text-2xl font-semibold">{item.value.toLocaleString()}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mb-8">
        <Card className="p-5 mb-3">
          <div className="flex flex-wrap items-start justify-between gap-1 mb-1">
            <p className="text-xs text-ink/50 font-medium">Total GMV</p>
            {gmvTrend.label && (
              <span
                className={`text-xs font-medium ${
                  gmvTrend.trend === 'up'
                    ? 'text-palm-600'
                    : gmvTrend.trend === 'down'
                      ? 'text-pepper-600'
                      : 'text-ink/40'
                }`}
              >
                {gmvTrend.trend === 'up' ? '↑ ' : gmvTrend.trend === 'down' ? '↓ ' : ''}
                {gmvTrend.label}
              </span>
            )}
          </div>
          <p className="font-display text-3xl sm:text-4xl font-semibold mb-3">₦{totalGMV.toLocaleString()}</p>
          <Sparkline data={gmvSpark} color="var(--color-marigold-500)" />
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KpiCard
            label="Merchants"
            value={merchantRows.length.toLocaleString()}
            trendLabel={merchantsTrend.label}
            trend={merchantsTrend.trend}
          />
          <KpiCard
            label={`Stores (${publishedCount} live)`}
            value={storeRows.length.toLocaleString()}
            trendLabel={storesTrend.label}
            trend={storesTrend.trend}
          />
          <KpiCard
            label={`Orders (${pendingCount} pending)`}
            value={orders.length.toLocaleString()}
            trendLabel={ordersTrend.label}
            trend={ordersTrend.trend}
          />
        </div>
      </div>

      <div>
        <h2 className="font-display text-sm font-semibold mb-3">Recent stores</h2>
        <Card className="p-0 overflow-hidden">
          {(recentStores ?? []).map((store, i) => {
            const isInternal = (store.merchants as unknown as { is_owner: boolean }).is_owner
            return (
              <Link key={store.id} href={`/owner/merchants/${store.merchant_id}`} className={`flex items-center justify-between gap-3 px-4 py-3 hover:bg-sand-100/60 transition-colors ${i !== (recentStores?.length ?? 0) - 1 ? 'border-b border-sand-200' : ''}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{store.name}</p>
                    {isInternal && <span className="shrink-0 text-[10px] font-medium rounded-full px-2 py-0.5 bg-indigo-50 text-indigo-600">Internal</span>}
                  </div>
                  <p className="text-xs text-ink/50 font-mono truncate">/{store.slug}</p>
                </div>
                <span className={`shrink-0 text-[11px] font-medium rounded-full px-2 py-0.5 ${store.is_published ? 'bg-palm-50 text-palm-600' : 'bg-sand-100 text-ink/50'}`}>
                  {store.is_published ? 'Live' : 'Draft'}
                </span>
              </Link>
            )
          })}
        </Card>
      </div>
    </div>
  )
}