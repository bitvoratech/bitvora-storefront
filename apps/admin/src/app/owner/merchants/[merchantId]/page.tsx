/* eslint-disable @next/next/no-img-element -- small previews of merchant-uploaded Cloudinary images; next/image has no remote patterns configured in the admin */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { ArrowLeft } from 'switch-icons'
import { SuspendButton } from './SuspendButton'
import { ReviewButtons } from '../../verifications/ReviewButtons'
import { Sparkline } from '../../SparkLine'
import { computeTrend } from '../../../../lib/computeTrend'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireOwnerPage } from '../../../../lib/auth/require-owner'

export default async function MerchantDetailPage({ params }: { params: Promise<{ merchantId: string }> }) {
  await requireOwnerPage()
  const { merchantId } = await params
  const admin = createAdminClient()

  const { data: merchant } = await admin
    .from('merchants')
    .select('id, full_name, business_name, phone, avatar_url, is_suspended, created_at, verification_status, phone_verified_at, nin, cac_number, verification_note')
    .eq('id', merchantId)
    .single()

  if (!merchant) notFound()

  const { data: stores } = await admin
    .from('stores')
    .select('id, name, slug, industry, is_published, created_at')
    .eq('merchant_id', merchantId)

  const storeIds = (stores ?? []).map((s) => s.id)
  const { data: orders } = storeIds.length
    ? await admin.from('orders').select('id, customer_name, total, status, created_at').in('store_id', storeIds).order('created_at', { ascending: false })
    : { data: [] }

  const orderRows = orders ?? []
  const activeOrders = orderRows.filter((o) => o.status !== 'cancelled')
  const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.total), 0)

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(startOfToday.getTime() - 14 * 24 * 60 * 60 * 1000)

  const revenueThisWeek = activeOrders
    .filter((o) => new Date(o.created_at) >= sevenDaysAgo)
    .reduce((sum, o) => sum + Number(o.total), 0)
  const revenueLastWeek = activeOrders
    .filter((o) => {
      const t = new Date(o.created_at)
      return t >= fourteenDaysAgo && t < sevenDaysAgo
    })
    .reduce((sum, o) => sum + Number(o.total), 0)
  const revenueTrend = computeTrend(revenueThisWeek, revenueLastWeek, 'vs last week')

  const spark = Array.from({ length: 14 }).map((_, i) => {
    const dayStart = new Date(startOfToday.getTime() - (13 - i) * 24 * 60 * 60 * 1000)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    return activeOrders.filter((o) => { const t = new Date(o.created_at); return t >= dayStart && t < dayEnd }).reduce((sum, o) => sum + Number(o.total), 0)
  })

  const initial = merchant.full_name?.[0]?.toUpperCase() || '?'
  const memberSince = new Date(merchant.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const statusLabel: Record<string, string> = {
    unverified: 'Not submitted',
    pending: 'Waiting for review',
    verified: 'Approved',
    failed: 'Rejected',
  }
  const canReview = !!merchant.phone_verified_at && !!merchant.nin && !!merchant.cac_number
    && (merchant.verification_status === 'pending' || merchant.verification_status === 'failed')

  return (
    <div>
      <Link href="/owner/merchants" className="flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to merchants
      </Link>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <Card>
          <div className="flex flex-col items-center text-center">
            {merchant.avatar_url ? (
              <img src={merchant.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover mb-3" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-semibold mb-3">
                {initial}
              </div>
            )}
            <p className="font-display font-semibold">{merchant.full_name || 'Unnamed'}</p>
            <p className="text-sm text-ink/50 mb-4">{merchant.business_name || '—'}</p>
            <div className="w-full space-y-2 text-left text-sm border-t border-sand-200 pt-4">
              <div className="flex justify-between"><span className="text-ink/50">Phone</span><span className="font-mono">{merchant.phone || '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-ink/50">Phone OTP</span><span>{merchant.phone_verified_at ? 'Verified' : 'Not yet'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-ink/50">NIN</span><span className="font-mono text-right break-all">{merchant.nin || '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-ink/50">CAC</span><span className="font-mono text-right break-all">{merchant.cac_number || '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-ink/50">Identity</span><span className="text-right">{statusLabel[merchant.verification_status] ?? merchant.verification_status}</span></div>
              {merchant.verification_status === 'failed' && merchant.verification_note && (
                <p className="text-xs text-pepper-600">{merchant.verification_note}</p>
              )}
              <div className="flex justify-between"><span className="text-ink/50">Stores</span><span className="font-mono">{stores?.length ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-ink/50">Since</span><span>{memberSince}</span></div>
            </div>
            {canReview && <ReviewButtons merchantId={merchant.id} />}
            <SuspendButton merchantId={merchant.id} isSuspended={merchant.is_suspended} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-ink/50 font-medium">Total revenue</p>
              {revenueTrend.label && (
                <span
                  className={`text-xs font-medium ${
                    revenueTrend.trend === 'up'
                      ? 'text-palm-600'
                      : revenueTrend.trend === 'down'
                        ? 'text-pepper-600'
                        : 'text-ink/40'
                  }`}
                >
                  {revenueTrend.trend === 'up' ? '↑ ' : revenueTrend.trend === 'down' ? '↓ ' : ''}
                  {revenueTrend.label}
                </span>
              )}
            </div>
            <p className="font-mono text-2xl font-semibold mb-3">₦{totalRevenue.toLocaleString()}</p>
            <Sparkline data={spark} color="var(--color-marigold-500)" />
          </Card>

          <div>
            <h2 className="font-display text-sm font-semibold mb-3">Stores</h2>
            <Card className="p-0 overflow-hidden">
              {(stores ?? []).map((store, i) => (
                <div key={store.id} className={`flex items-center justify-between px-4 py-3 ${i !== (stores?.length ?? 0) - 1 ? 'border-b border-sand-200' : ''}`}>
                  <div>
                    <p className="text-sm font-medium">{store.name}</p>
                    <p className="text-xs text-ink/50 font-mono">/{store.slug} · {store.industry}</p>
                  </div>
                  <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${store.is_published ? 'bg-palm-50 text-palm-600' : 'bg-sand-100 text-ink/50'}`}>
                    {store.is_published ? 'Live' : 'Draft'}
                  </span>
                </div>
              ))}
              {(stores?.length ?? 0) === 0 && <p className="text-sm text-ink/50 px-4 py-6 text-center">No stores yet.</p>}
            </Card>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold mb-3">Recent orders</h2>
            <Card className="p-0 overflow-hidden">
              {orderRows.slice(0, 8).map((order, i) => (
                <div key={order.id} className={`flex items-center justify-between px-4 py-3 ${i !== Math.min(orderRows.length, 8) - 1 ? 'border-b border-sand-200' : ''}`}>
                  <p className="text-sm font-medium">{order.customer_name}</p>
                  <p className="font-mono text-sm">₦{Number(order.total).toLocaleString()}</p>
                </div>
              ))}
              {orderRows.length === 0 && <p className="text-sm text-ink/50 px-4 py-6 text-center">No orders yet.</p>}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 