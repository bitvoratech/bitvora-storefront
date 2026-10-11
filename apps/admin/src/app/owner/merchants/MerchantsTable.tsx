'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { IconSearch } from '@tabler/icons-react'
import { toggleMerchantSuspension } from '../action'

type Merchant = {
  id: string
  full_name: string | null
  business_name: string | null
  phone: string | null
  is_suspended: boolean
  created_at: string
}

export function MerchantsTable({ merchants }: { merchants: Merchant[] }) {
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [localMerchants, setLocalMerchants] = useState(merchants)
  const [error, setError] = useState<string | null>(null)

  const q = search.toLowerCase()
  const filtered = localMerchants.filter(
    (m) =>
      (m.full_name ?? '').toLowerCase().includes(q) ||
      (m.business_name ?? '').toLowerCase().includes(q)
  )

  function setSuspended(id: string, suspended: boolean) {
    setLocalMerchants((prev) => prev.map((m) => (m.id === id ? { ...m, is_suspended: suspended } : m)))
  }

  function handleToggle(id: string, suspend: boolean) {
    setError(null)
    setSuspended(id, suspend) // optimistic
    startTransition(async () => {
      const result = await toggleMerchantSuspension(id, suspend)
      if (result?.error) {
        setSuspended(id, !suspend) // revert
        setError(result.error)
      }
    })
  }

  return (
    <div>
      <div className="relative mb-4 max-w-xs">
        <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" stroke={1.75} />
        <input
          type="text"
          placeholder="Search merchants…"
          aria-label="Search merchants"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-base sm:text-sm rounded-lg border border-sand-200 bg-white dark:bg-sand-100 focus:outline-none focus:border-indigo-600"
        />
      </div>

      {error && (
        <p className="mb-3 text-sm text-pepper-600 bg-pepper-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 py-2.5 bg-sand-100 text-xs font-semibold uppercase tracking-wide text-ink/50">
          <span>Name</span>
          <span>Business</span>
          <span>Phone</span>
          <span>Status</span>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-ink/50 px-4 py-8 text-center">No merchants found.</p>
        )}

        {filtered.map((m, i) => (
          <div
            key={m.id}
            className={`relative grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-center px-4 py-3 hover:bg-sand-100/60 transition-colors ${
              i !== filtered.length - 1 ? 'border-b border-sand-200' : ''
            }`}
          >
            <Link
              href={`/owner/merchants/${m.id}`}
              aria-label={`View ${m.full_name || 'merchant'}`}
              className="absolute inset-0"
            />
            <p className="text-sm font-medium truncate">{m.full_name || '—'}</p>
            <p className="text-sm text-ink/60 truncate">{m.business_name || '—'}</p>
            <p className="text-sm font-mono text-ink/60 hidden sm:block">{m.phone || '—'}</p>
            <button
              type="button"
              onClick={() => handleToggle(m.id, !m.is_suspended)}
              disabled={isPending}
              className={`relative z-10 text-xs rounded-full px-3 py-1.5 font-medium disabled:opacity-50 ${
                m.is_suspended ? 'bg-pepper-50 text-pepper-600' : 'bg-palm-50 text-palm-600'
              }`}
            >
              {m.is_suspended ? 'Suspended' : 'Active'}
            </button>
          </div>
        ))}
      </Card>
    </div>
  )
}