'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { removeAdmin } from './actions'

export function RemoveAdminButton({ merchantId, name }: { merchantId: string; name: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    if (!window.confirm(`Remove ${name} as an admin? They lose access to the owner console.`)) return
    setError(null)
    startTransition(async () => {
      const result = await removeAdmin(merchantId)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg px-3 py-1.5 text-xs font-medium bg-pepper-50 text-pepper-600 hover:bg-pepper-100 disabled:opacity-50"
      >
        {isPending ? 'Removing...' : 'Remove'}
      </button>
      {error && <p role="alert" className="mt-1 text-xs text-pepper-600">{error}</p>}
    </div>
  )
}
