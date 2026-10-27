'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { reviewPlanTransfer } from '../action'

export function TransferButtons({ transferId }: { transferId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(decision: 'confirm' | 'reject') {
    setError(null)
    startTransition(async () => {
      const result = await reviewPlanTransfer(transferId, decision, note)
      if (result?.error) {
        setError(result.error)
        return
      }
      setRejecting(false)
      setNote('')
      router.refresh()
    })
  }

  return (
    <div>
      {rejecting ? (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="e.g. No transfer with this reference arrived. The merchant sees this."
            aria-label="Reason for rejecting"
            className="w-full rounded-lg border border-sand-200 bg-white dark:bg-sand-100 px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-indigo-600"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => submit('reject')} disabled={isPending} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium bg-pepper-50 text-pepper-600 hover:bg-pepper-100 disabled:opacity-50">
              {isPending ? 'Saving...' : 'Reject'}
            </button>
            <button type="button" onClick={() => setRejecting(false)} disabled={isPending} className="rounded-lg px-3 py-2 text-sm text-ink/60 hover:text-ink disabled:opacity-50">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button type="button" onClick={() => submit('confirm')} disabled={isPending} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium bg-palm-50 text-palm-600 hover:bg-palm-100 disabled:opacity-50">
            {isPending ? 'Saving...' : 'Money received, activate'}
          </button>
          <button type="button" onClick={() => setRejecting(true)} disabled={isPending} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium bg-pepper-50 text-pepper-600 hover:bg-pepper-100 disabled:opacity-50">
            Not received
          </button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-pepper-600">{error}</p>}
    </div>
  )
}
