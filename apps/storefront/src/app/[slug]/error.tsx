'use client'

import { useEffect } from 'react'

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="text-center py-20 max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-sm text-[#737373] mb-6">
        We couldn&apos;t load this page. Check your connection and try again.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-[#171717] text-white px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  )
}
