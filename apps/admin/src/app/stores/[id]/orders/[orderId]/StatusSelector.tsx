'use client'

import { useState, useTransition } from 'react'
import { updateOrderStatus } from '../actions'

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

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

  function handleChange(status: string) {
    setError(null)
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, storeId, status)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => handleChange(status)}
            disabled={isPending}
            className={`text-xs rounded-full px-3 py-1.5 font-medium capitalize border transition-colors disabled:opacity-50 ${
              currentStatus === status
                ? 'bg-indigo-600 text-white border-indigo-600'
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