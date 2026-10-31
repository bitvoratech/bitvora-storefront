'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { IconArrowRight, IconPackage, IconPalette, IconReceipt, IconSearch } from '@tabler/icons-react'

type Store = {
  id: string
  name: string
  slug: string
  industry: string | null
  is_published: boolean
  ordersThisWeek: number
  revenueThisWeek: number
  pendingOrders: number
}

export function StoresGrid({ stores }: { stores: Store[] }) {
  const [search, setSearch] = useState('')

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {stores.length > 1 && (
        <div className="relative mb-4 max-w-xs">
          <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" stroke={1.75} />
          <input
            type="text"
            placeholder="Search stores…"
            aria-label="Search stores"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-base sm:text-sm rounded-lg border border-sand-200 bg-white dark:bg-sand-100 focus:outline-none focus:border-indigo-600"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-ink/50 py-10 text-center">No stores match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((store) => (
            <Card key={store.id} className="hover:border-indigo-600 transition-colors">
              <Link href={`/stores/${store.id}`} className="block">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display font-medium text-lg truncate">{store.name}</p>
                    <p className="text-sm text-ink/50 font-mono truncate">/{store.slug}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs rounded-full px-2.5 py-1 font-medium ${
                      store.is_published ? 'bg-palm-50 text-palm-600' : 'bg-sand-100 text-ink/50'
                    }`}
                  >
                    {store.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                {store.industry && <p className="text-sm text-ink/50 mt-2 capitalize">{store.industry}</p>}
              </Link>

              {store.pendingOrders > 0 && (
                <Link
                  href={`/stores/${store.id}/orders?status=pending`}
                  className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-marigold-50 px-3 py-2 text-xs font-medium text-ink/80 hover:opacity-90 transition-opacity"
                >
                  <span>
                    <span className="font-mono">{store.pendingOrders}</span>{' '}
                    {store.pendingOrders === 1 ? 'order needs' : 'orders need'} your attention
                  </span>
                  <IconArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </Link>
              )}

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-sand-200">
                <div>
                  <p className="text-[11px] text-ink/50">Orders · this week</p>
                  <p className="font-mono text-sm font-semibold">{store.ordersThisWeek}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ink/50">Revenue · this week</p>
                  <p className="font-mono text-sm font-semibold">₦{store.revenueThisWeek.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-sand-200">
                <Link
                  href={`/stores/${store.id}/products`}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-ink/60 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg py-1.5 transition-colors"
                >
                  <IconPackage className="w-3.5 h-3.5" />
                  Products
                </Link>
                <Link
                  href={`/stores/${store.id}/orders`}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-ink/60 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg py-1.5 transition-colors"
                >
                  <IconReceipt className="w-3.5 h-3.5" />
                  Orders
                </Link>
                <Link
                  href={`/stores/${store.id}/customize`}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-ink/60 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg py-1.5 transition-colors"
                >
                  <IconPalette className="w-3.5 h-3.5" stroke={1.75} />
                  Customize
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}