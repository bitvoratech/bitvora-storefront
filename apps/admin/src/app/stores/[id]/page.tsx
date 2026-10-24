import { createClient } from '../../../lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { OnboardingProgress } from './OnboardingProgress'
import { RecentOrders } from './RecentOrders'
import { TopProducts } from './TopProducts'
import { Card } from '@bitvora/ui/src/Card'
import { KpiCard } from '@bitvora/ui/src/KpiCard'
import { RevenueChart } from './RevenueChart'
import { computeTrend } from '../../../lib/computeTrend'
import { storefrontUrl } from '../../../lib/storefront-url'
import { ShareStoreCard } from './ShareStoreCard'
import { PublishToggle } from './PublishToggle'
import { NeedsAttention, type AttentionItem } from './NeedsAttention'
import { IconTruckDelivery, IconChevronRight } from '@tabler/icons-react'

export default async function StoreDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: store, error } = await supabase.from('stores').select('*').eq('id', id).single()
  if (error || !store) notFound()

  const { count: productCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', id)

  const { data: heroSection } = await supabase
    .from('sections')
    .select('id')
    .eq('store_id', id)
    .eq('type', 'hero')
    .maybeSingle()

  const { count: zoneCount } = await supabase
    .from('delivery_zones')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', id)

  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_name, total, status, created_at, payment_method, payment_proof_url')
    .eq('store_id', id)
    .order('created_at', { ascending: false })

  const LOW_STOCK = 5
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('name, stock_quantity')
    .eq('store_id', id)
    .eq('is_active', true)
    .lte('stock_quantity', LOW_STOCK)
    .order('stock_quantity', { ascending: true })

  // Shoppers waiting on restocks, with the product's current stock.
  const { data: restockRows } = await supabase
    .from('restock_requests')
    .select('product_id, products(name, stock_quantity)')
    .eq('store_id', id)
    .is('notified_at', null)

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('product_name, quantity, orders!inner(store_id)')
    .eq('orders.store_id', id)

  const allOrders = orders ?? []
  const activeOrders = allOrders.filter((o) => o.status !== 'cancelled')

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const ordersToday = allOrders.filter((o) => new Date(o.created_at) >= startOfToday).length
  const ordersYesterday = allOrders.filter((o) => {
    const t = new Date(o.created_at)
    return t >= startOfYesterday && t < startOfToday
  }).length

  const revenueThisWeek = activeOrders
    .filter((o) => new Date(o.created_at) >= sevenDaysAgo)
    .reduce((sum, o) => sum + Number(o.total), 0)
  const revenueLastWeek = activeOrders
    .filter((o) => {
      const t = new Date(o.created_at)
      return t >= fourteenDaysAgo && t < sevenDaysAgo
    })
    .reduce((sum, o) => sum + Number(o.total), 0)

  const pendingCount = allOrders.filter((o) => o.status === 'pending').length

  const pendingOrders = allOrders.filter((o) => o.status === 'pending')
  const toVerify = pendingOrders.filter((o) => o.payment_method === 'bank_transfer' && o.payment_proof_url)
  const awaitingPayment = pendingOrders.filter((o) => o.payment_method === 'bank_transfer' && !o.payment_proof_url)
  const toConfirm = pendingOrders.filter((o) => o.payment_method === 'pay_on_delivery')
  const lowStock = lowStockProducts ?? []
  const soldOut = lowStock.filter((p) => (p.stock_quantity ?? 0) <= 0).length
  const names = (list: { customer_name: string }[]) =>
    list.slice(0, 3).map((o) => o.customer_name.split(' ')[0]).join(', ') + (list.length > 3 ? '…' : '')

  type RestockRow = { product_id: string; products: { name: string; stock_quantity: number | null } | null }
  const restock = (restockRows ?? []) as unknown as RestockRow[]
  const backInStock = restock.filter((r) => (r.products?.stock_quantity ?? 0) > 0)
  const backInStockProducts = [...new Map(backInStock.map((r) => [r.product_id, r.products?.name ?? 'Product'])).entries()]

  const attention: AttentionItem[] = [
    {
      key: 'restock',
      count: backInStock.length,
      title: backInStock.length === 1 ? 'shopper to message — item is back' : 'shoppers to message — items are back',
      detail: `They asked to be told · ${backInStockProducts.slice(0, 3).map(([, n]) => n).join(', ')}`,
      href: backInStockProducts.length === 1
        ? `/stores/${id}/products/${backInStockProducts[0][0]}/edit#restock`
        : `/stores/${id}/products`,
      tone: 'urgent',
    },
    {
      key: 'verify',
      count: toVerify.length,
      title: toVerify.length === 1 ? 'transfer to verify' : 'transfers to verify',
      detail: `Check your bank app, then confirm · ${names(toVerify)}`,
      href: `/stores/${id}/orders?status=pending`,
      tone: 'urgent',
    },
    {
      key: 'confirm',
      count: toConfirm.length,
      title: toConfirm.length === 1 ? 'pay-on-delivery order to confirm' : 'pay-on-delivery orders to confirm',
      detail: `Call or WhatsApp to confirm · ${names(toConfirm)}`,
      href: `/stores/${id}/orders?status=pending`,
      tone: 'warning',
    },
    {
      key: 'stock',
      count: lowStock.length,
      title: lowStock.length === 1 ? 'product low on stock' : 'products low on stock',
      detail: soldOut
        ? `${soldOut} sold out · ${lowStock.slice(0, 3).map((p) => p.name).join(', ')}`
        : lowStock.slice(0, 3).map((p) => `${p.name} (${p.stock_quantity})`).join(', '),
      href: `/stores/${id}/products`,
      tone: soldOut ? 'urgent' : 'warning',
    },
    {
      key: 'awaiting',
      count: awaitingPayment.length,
      title: awaitingPayment.length === 1 ? 'order waiting for payment' : 'orders waiting for payment',
      detail: 'Customer chose bank transfer but hasn’t uploaded proof yet',
      href: `/stores/${id}/orders?status=pending`,
      tone: 'info',
    },
  ]

  const ordersThisWeekCount = activeOrders.filter((o) => new Date(o.created_at) >= sevenDaysAgo).length
  const ordersLastWeekCount = activeOrders.filter((o) => {
    const t = new Date(o.created_at)
    return t >= fourteenDaysAgo && t < sevenDaysAgo
  }).length
  const avgOrderThisWeek = ordersThisWeekCount ? revenueThisWeek / ordersThisWeekCount : 0
  const avgOrderLastWeek = ordersLastWeekCount ? revenueLastWeek / ordersLastWeekCount : 0

  const ordersTrend = computeTrend(ordersToday, ordersYesterday, 'vs yesterday')
  const revenueTrend = computeTrend(revenueThisWeek, revenueLastWeek, 'vs last week')
  const avgOrderTrend = computeTrend(avgOrderThisWeek, avgOrderLastWeek, 'vs last week')

  const productTotals = new Map<string, number>()
  for (const item of orderItems ?? []) {
    productTotals.set(item.product_name, (productTotals.get(item.product_name) ?? 0) + item.quantity)
  }
  const topProducts = [...productTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, unitsSold]) => ({ name, unitsSold }))

  const dailyRevenue = Array.from({ length: 7 }).map((_, i) => {
    const dayStart = new Date(startOfToday.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    const total = activeOrders
      .filter((o) => {
        const t = new Date(o.created_at)
        return t >= dayStart && t < dayEnd
      })
      .reduce((sum, o) => sum + Number(o.total), 0)
    return { label: dayStart.toLocaleDateString('en-US', { weekday: 'short' }), total }
  })

  const checklistItems = [
    { label: 'Add your bank account', done: !!store.bank_name && !!store.account_number, href: `/stores/${id}/delivery#bank` },
    { label: 'Set your brand color', done: !!store.palette?.primary, href: `/stores/${id}/customize` },
    {
      label: 'Set up delivery or pickup',
      done: (zoneCount ?? 0) > 0 || (store.pickup_enabled && !!store.pickup_address),
      href: `/stores/${id}/delivery`,
    },
    { label: 'Add at least one product', done: (productCount ?? 0) > 0, href: `/stores/${id}/products/new` },
    { label: 'Set up your homepage hero', done: !!heroSection, href: `/stores/${id}/customize` },
    { label: 'Publish your store', done: store.is_published, href: `/stores/${id}#publish` },
  ]

  const storeUrl = storefrontUrl(store.slug)

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
        <h1 className="text-2xl font-display font-semibold">{store.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {storeUrl && (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm rounded-md px-3 py-1.5 font-medium bg-sand-100 text-ink/70 hover:bg-sand-200 transition-colors"
            >
              View store ↗
            </a>
          )}
          <span id="publish" className="scroll-mt-6">
            <PublishToggle storeId={store.id} isPublished={store.is_published} />
          </span>
          <Link
            href={`/stores/${store.id}/products/new`}
            className="text-sm rounded-md px-3 py-1.5 font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Add product
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-mono text-ink/60 bg-sand-100 rounded-full px-2.5 py-1">/{store.slug}</span>
        {store.industry && (
          <span className="text-xs font-medium text-ink/60 bg-sand-100 rounded-full px-2.5 py-1 capitalize">{store.industry}</span>
        )}
        {store.is_published && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-palm-600">
            <span className="w-1.5 h-1.5 rounded-full bg-palm-600" /> Live
          </span>
        )}
      </div>

      <OnboardingProgress storeId={store.id} items={checklistItems} />

      {/* Checkout only offers delivery once a store has delivery areas, so a
          pickup-only store can look finished while shoppers can't get delivery. */}
      {(zoneCount ?? 0) === 0 && (
        <Link
          href={`/stores/${id}/delivery`}
          className="group mb-6 flex items-center gap-3 rounded-[var(--radius-card)] border border-marigold-500/30 bg-marigold-50 p-3.5 hover:border-indigo-600/50 transition-colors"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-sand-100 text-marigold-500">
            <IconTruckDelivery className="w-5 h-5" stroke={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Add delivery areas</span>
            <span className="block text-xs text-ink/60">
              Shoppers can only choose pickup right now. Add the areas you deliver to, with a fee, so they can pick delivery at checkout.
            </span>
          </span>
          <IconChevronRight className="w-4 h-4 text-ink/30 group-hover:text-indigo-600 shrink-0" stroke={1.75} />
        </Link>
      )}

      <NeedsAttention items={attention} />

      {storeUrl && <ShareStoreCard url={storeUrl} storeName={store.name} isPublished={store.is_published} />}

      <div className="mb-8">
        <Card className="p-5 mb-3 border-0 bg-paper">
            <p className="text-xs text-ink/50 font-medium">Revenue · this week</p>
<div className="flex flex-col items-start  mb-1">
          <p className="font-mono text-3xl font-semibold mb-1">₦{revenueThisWeek.toLocaleString()}</p>
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
        </Card>

        <RevenueChart data={dailyRevenue} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <KpiCard
            label="Orders today"
            value={ordersToday.toLocaleString()}
            trendLabel={ordersTrend.label}
            trend={ordersTrend.trend}
          />
          <KpiCard label="Pending" value={pendingCount.toLocaleString()} />
          <KpiCard
            label="Avg. order"
            value={`₦${Math.round(avgOrderThisWeek).toLocaleString()}`}
            trendLabel={avgOrderTrend.label}
            trend={avgOrderTrend.trend}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <RecentOrders storeId={store.id} orders={allOrders.slice(0, 5)} />
        <TopProducts products={topProducts} />
      </div>
    </div>
  )
}