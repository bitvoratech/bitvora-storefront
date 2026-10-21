'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { StatusBadge } from './StatusBadge'
import { Receipt } from 'switch-icons'
import { IconSearch } from '@tabler/icons-react'

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
      <Card className="text-center py-14">
        <Receipt className="w-8 h-8 text-ink/20 mx-auto mb-3" />
        <p className="text-ink/50">No orders yet.</p>
      </Card>
    )
  }

  return (
    <div>
      <div className="relative mb-3 max-w-xs">
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

      <div className="flex flex-wrap gap-1.5 mb-4">
        {['all', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs rounded-full px-3 py-1.5 font-medium capitalize border transition-colors ${
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
          {filtered.map((order, i) => (
            <Link
              key={order.id}
              href={`/stores/${storeId}/orders/${order.id}`}
              className={`flex items-center justify-between gap-3 px-4 py-3 sm:grid sm:grid-cols-[1.4fr_1fr_auto_auto_auto] sm:items-center hover:bg-sand-100/60 transition-colors ${
                i !== filtered.length - 1 ? 'border-b border-sand-200' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{order.customer_name}</p>
                <p className="text-[11px] font-mono text-ink/40">
                  #{order.id.slice(0, 8).toUpperCase()}
                  {order.status === 'pending' && order.payment_method === 'bank_transfer' && (
                    <span className={`ml-2 font-sans font-medium ${order.payment_proof_url ? 'text-pepper-600' : 'text-ink/40'}`}>
                      {order.payment_proof_url ? '· Proof to verify' : '· Awaiting payment'}
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink/50 sm:hidden">
                  <span className="font-mono">{order.customer_phone}</span> · <span suppressHydrationWarning>{formatOrderDate(order.created_at)}</span>
                </p>
              </div>
              <p className="text-sm text-ink/60 font-mono hidden sm:block">{order.customer_phone}</p>
              {/* Server and browser time zones can differ; the browser's wins. */}
              <p className="text-sm text-ink/60 hidden sm:block whitespace-nowrap" suppressHydrationWarning>{formatOrderDate(order.created_at)}</p>
              <p className="font-mono text-sm">₦{Number(order.total).toLocaleString()}</p>
              <div className="shrink-0"><StatusBadge status={order.status} /></div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  )
}