'use client'

import { useState, useTransition } from 'react'
import { Button } from '@bitvora/ui/src/Button'
import { updateOrderStatus } from '../actions'

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

// The usual next step for each status, offered as the main button.
const NEXT_STEP: Record<string, { status: string; label: string }> = {
  pending: { status: 'confirmed', label: 'Confirm order' },
  confirmed: { status: 'shipped', label: 'Mark as shipped' },
  shipped: { status: 'delivered', label: 'Mark as delivered' },
}

export function StatusSelector({
  orderId,
  storeId,
  currentStatus,
}: {
  orderId: string
  storeId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const next = NEXT_STEP[currentStatus]

  function handleChange(status: string) {
    if (status === currentStatus) return
    // Cancelling is the one change a stray tap shouldn't make on its own.
    if (status === 'cancelled' && !window.confirm('Cancel this order? The customer’s order will show as cancelled.')) return
    setError(null)
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, storeId, status)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      {next && (
        <>
          <div className="hidden sm:block mb-3">
            <Button onClick={() => handleChange(next.status)} disabled={isPending} className="w-full">
              {isPending ? 'Updating...' : next.label}
            </Button>
          </div>
          {/* On a phone the next step also stays pinned to the bottom of the
              screen, so it's in reach after scrolling through the items. */}
          <div className="sm:hidden fixed inset-x-0 bottom-0 z-10 border-t border-sand-200 bg-white/95 dark:bg-sand-100/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button onClick={() => handleChange(next.status)} disabled={isPending} className="w-full py-3">
              {isPending ? 'Updating...' : next.label}
            </Button>
          </div>
        </>
      )}
      <p className="text-xs text-ink/50 mb-1.5">
        {next ? (
          <>
            <span className="sm:hidden">Tap a status to change it:</span>
            <span className="hidden sm:inline">Or set the status directly:</span>
          </>
        ) : (
          'Tap a status to change it:'
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => handleChange(status)}
            disabled={isPending}
            aria-pressed={currentStatus === status}
            className={`text-xs rounded-full px-3 py-1.5 font-medium capitalize border transition-colors disabled:opacity-50 ${
              currentStatus === status
                ? 'bg-indigo-600 text-white border-indigo-600'
                : status === 'cancelled'
                  ? 'border-sand-200 text-pepper-600 hover:border-pepper-600'
                  : 'border-sand-200 text-ink/60 hover:border-indigo-600'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
