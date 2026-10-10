'use client'

import { useState, useTransition } from 'react'
import { IconBell, IconBrandWhatsapp, IconCheck } from '@tabler/icons-react'
import { Card } from '@bitvora/ui/src/Card'
import { markRestockNotified } from './restock-actions'

type Request = { id: string; customer_name: string | null; customer_phone: string; created_at: string }

function toWhatsAppNumber(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('234')) return digits
  if (digits.startsWith('0')) return `234${digits.slice(1)}`
  return digits
}

// Shoppers who asked to be told when this product is back. Each row opens a
// pre-written WhatsApp message; the merchant then marks it as sent.
export function RestockRequests({
  storeId,
  productId,
  productName,
  storeName,
  productUrl,
  inStock,
  requests,
}: {
  storeId: string
  productId: string
  productName: string
  storeName: string
  productUrl: string | null
  inStock: boolean
  requests: Request[]
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (requests.length === 0) return null

  function mark(ids: string[]) {
    setError(null)
    startTransition(async () => {
      const result = await markRestockNotified(storeId, productId, ids)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <Card id="restock" className="mt-4 scroll-mt-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2">
          <IconBell className="w-4 h-4 mt-0.5 text-indigo-600 shrink-0" stroke={1.75} />
          <div>
            <p className="text-sm font-medium">{requests.length} waiting for restock</p>
            <p className="text-xs text-ink/50 mt-0.5">
              {inStock
                ? 'It’s back in stock — message them now. These are warm buyers.'
                : 'Update the stock above when it’s back, then message them here.'}
            </p>
          </div>
        </div>
        {requests.length > 1 && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => mark(requests.map((r) => r.id))}
            className="shrink-0 text-xs font-medium text-ink/60 hover:text-ink disabled:opacity-50"
          >
            Mark all messaged
          </button>
        )}
      </div>

      <ul className="divide-y divide-sand-200">
        {requests.map((r) => {
          const first = r.customer_name?.split(' ')[0]
          const message = `Hi${first ? ` ${first}` : ''}! Good news from ${storeName}: ${productName} is back in stock.${productUrl ? ` Order here: ${productUrl}` : ''}`
          return (
            <li key={r.id} className="flex items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="text-sm truncate">{r.customer_name || 'Customer'}</p>
                <p className="text-xs font-mono text-ink/50">{r.customer_phone}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={`https://wa.me/${toWhatsAppNumber(r.customer_phone)}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-palm-50 text-palm-600 hover:opacity-90"
                >
                  <IconBrandWhatsapp className="w-3.5 h-3.5" stroke={1.75} /> Message
                </a>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => mark([r.id])}
                  aria-label={`Mark ${r.customer_name || r.customer_phone} as messaged`}
                  title="Mark as messaged"
                  className="p-1.5 rounded-lg text-ink/40 hover:text-palm-600 hover:bg-palm-50 disabled:opacity-50"
                >
                  <IconCheck className="w-4 h-4" stroke={2} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      {error && <p role="alert" className="text-sm text-pepper-600 mt-2">{error}</p>}
    </Card>
  )
}
