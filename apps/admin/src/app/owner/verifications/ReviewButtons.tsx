'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { reviewMerchantVerification } from '../action'

export function ReviewButtons({ merchantId, compact = false }: { merchantId: string; compact?: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(decision: 'approve' | 'reject') {
    setError(null)
    startTransition(async () => {
      const result = await reviewMerchantVerification(merchantId, decision, note)
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
    <div className={compact ? '' : 'w-full mt-3'}>
      {rejecting ? (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="What's wrong? The merchant sees this."
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
          <button type="button" onClick={() => submit('approve')} disabled={isPending} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium bg-palm-50 text-palm-600 hover:bg-palm-100 disabled:opacity-50">
            {isPending ? 'Saving...' : 'Approve'}
          </button>
          <button type="button" onClick={() => setRejecting(true)} disabled={isPending} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium bg-pepper-50 text-pepper-600 hover:bg-pepper-100 disabled:opacity-50">
            Reject
          </button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-pepper-600">{error}</p>}
    </div>
  )
}
