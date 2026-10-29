'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { StatusBadge } from './StatusBadge'
import { Receipt } from 'switch-icons'
import { IconSearch, IconReceiptRefund } from '@tabler/icons-react'

type Order = {
  id: string
  customer_name: string
  customer_phone: string
  total: number
  status: string
  created_at: string
  payment_method?: string
  payment_proof_url?: string | null
}

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

// "Today 14:05", "Yesterday", or "12 Oct"; this year's dates skip the year.
function formatOrderDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayMs = 24 * 60 * 60 * 1000
  if (d >= startOfToday) return `Today ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  if (d >= new Date(startOfToday.getTime() - dayMs)) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) })
}

export function OrdersTable({ storeId, orders, initialStatus = 'all' }: { storeId: string; orders: Order[]; initialStatus?: string }) {
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [search, setSearch] = useState('')

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length }
    for (const s of STATUSES) c[s] = orders.filter((o) => o.status === s).length
    return c
  }, [orders])

  const toVerify = orders.filter(
    (o) => o.status === 'pending' && o.payment_method === 'bank_transfer' && o.payment_proof_url,
  ).length

  // Merchants look orders up by name, phone, or the reference the customer quotes.
  const q = search.trim().toLowerCase()
  const qDigits = q.replace(/\D/g, '')
  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (!q) return true
    return (
      o.customer_name.toLowerCase().includes(q) ||
      o.id.slice(0, 8).toLowerCase().includes(q.replace(/^#/, '')) ||
      (qDigits.length >= 3 && o.customer_phone.replace(/\D/g, '').includes(qDigits))
    )
  })

  if (orders.length === 0) {
    return (
      <Card className="text-center py-14 px-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-6 h-6 text-indigo-600" />
        </div>
        <p className="font-display font-semibold mb-1">No orders yet</p>
        <p className="text-sm text-ink/50 max-w-xs mx-auto mb-5">When a customer orders from your store, it shows up here. Share your store link to get the first one.</p>
        <Link href={`/stores/${storeId}`} className="text-sm font-medium text-indigo-600 hover:underline">
          Get your store link →
        </Link>
      </Card>
    )
  }

  return (
    <div>
      {toVerify > 0 && statusFilter !== 'pending' && (
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className="w-full flex items-center gap-3 text-left rounded-xl border border-pepper-600/20 bg-pepper-50 px-4 py-3 mb-4 hover:border-pepper-600/50 transition-colors"
        >
          <IconReceiptRefund className="w-5 h-5 text-pepper-600 shrink-0" stroke={1.75} />
          <span className="flex-1 text-sm">
            <span className="font-medium text-pepper-600">
              {toVerify} payment proof{toVerify === 1 ? '' : 's'} to check
            </span>
            <span className="block text-xs text-ink/60">Confirm the transfer landed, then confirm the order.</span>
          </span>
          <span className="text-xs font-medium text-pepper-600 shrink-0">View</span>
        </button>
      )}

      <div className="relative mb-3 sm:max-w-xs">
        <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" stroke={1.75} />
        <input
          type="search"
          placeholder="Search name, phone or #ref…"
          aria-label="Search orders"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-base sm:text-sm rounded-lg border border-sand-200 bg-white dark:bg-sand-100 focus:outline-none focus:border-indigo-600"
        />
      </div>

      {/* One scrolling row on a phone instead of chips wrapping onto several lines. */}
      <div className="flex gap-1.5 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {['all', ...STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            aria-pressed={statusFilter === s}
            className={`shrink-0 whitespace-nowrap text-xs rounded-full px-3 py-1.5 font-medium capitalize border transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-sand-200 text-ink/60 hover:border-indigo-600'
            }`}
          >
            {s === 'all' ? 'All' : s} <span className="opacity-60">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-ink/50">{q ? 'No orders match your search.' : 'No orders with this status.'}</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1.4fr_1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-sand-100 text-xs font-semibold uppercase tracking-wide text-ink/50">
            <span>Customer</span>
            <span>Phone</span>
            <span>Date</span>
            <span>Total</span>
            <span>Status</span>
          </div>
          {filtered.map((order, i) => {
            const proofNote =
              order.status === 'pending' && order.payment_method === 'bank_transfer'
                ? order.payment_proof_url
                  ? { text: 'Proof to verify', className: 'text-pepper-600' }
                  : { text: 'Awaiting payment', className: 'text-ink/40' }
                : null
            return (
              <Link
                key={order.id}
                href={`/stores/${storeId}/orders/${order.id}`}
                className={`flex items-start justify-between gap-3 px-4 py-3 sm:grid sm:grid-cols-[1.4fr_1fr_auto_auto_auto] sm:items-center hover:bg-sand-100/60 active:bg-sand-100 transition-colors ${
                  i !== filtered.length - 1 ? 'border-b border-sand-200' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{order.customer_name}</p>
                  <p className="text-[11px] font-mono text-ink/40">
                    #{order.id.slice(0, 8).toUpperCase()}
                    {/* Server and browser time zones can differ; the browser's wins. */}
                    <span className="sm:hidden font-sans" suppressHydrationWarning> · {formatOrderDate(order.created_at)}</span>
                  </p>
                  {proofNote && (
                    <p className={`text-xs font-medium mt-0.5 ${proofNote.className}`}>{proofNote.text}</p>
                  )}
                </div>
                <p className="text-sm text-ink/60 font-mono hidden sm:block">{order.customer_phone}</p>
                <p className="text-sm text-ink/60 hidden sm:block whitespace-nowrap" suppressHydrationWarning>{formatOrderDate(order.created_at)}</p>
                {/* On a phone, total and status stack on the right like a receipt line. */}
                <p className="hidden sm:block font-mono text-sm">₦{Number(order.total).toLocaleString()}</p>
                <div className="shrink-0 flex flex-col items-end gap-1.5 sm:block">
                  <p className="sm:hidden font-mono text-sm font-medium">₦{Number(order.total).toLocaleString()}</p>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            )
          })}
        </Card>
      )}
    </div>
  )
}