'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { StatusBadge } from './StatusBadge'
import { Receipt } from 'switch-icons'

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

export function OrdersTable({ storeId, orders, initialStatus = 'all' }: { storeId: string; orders: Order[]; initialStatus?: string }) {
  const [statusFilter, setStatusFilter] = useState(initialStatus)

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length }
    for (const s of STATUSES) c[s] = orders.filter((o) => o.status === s).length
    return c
  }, [orders])

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)

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
          <p className="text-sm text-ink/50">No orders with this status.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1.4fr_1fr_auto_auto] gap-4 px-4 py-2.5 bg-sand-100 text-xs font-semibold uppercase tracking-wide text-ink/50">
            <span>Customer</span>
            <span>Phone</span>
            <span>Total</span>
            <span>Status</span>
          </div>
          {filtered.map((order, i) => (
            <Link
              key={order.id}
              href={`/stores/${storeId}/orders/${order.id}`}
              className={`flex items-center justify-between gap-3 px-4 py-3 sm:grid sm:grid-cols-[1.4fr_1fr_auto_auto] sm:items-center hover:bg-sand-100/60 transition-colors ${
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
                <p className="text-xs text-ink/50 font-mono sm:hidden">{order.customer_phone}</p>
              </div>
              <p className="text-sm text-ink/60 font-mono hidden sm:block">{order.customer_phone}</p>
              <p className="font-mono text-sm">₦{Number(order.total).toLocaleString()}</p>
              <div className="shrink-0"><StatusBadge status={order.status} /></div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  )
}