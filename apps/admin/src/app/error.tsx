'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@bitvora/ui/src/Button'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="max-w-md mx-auto text-center py-16">
      <h1 className="text-xl font-display font-semibold mb-2">Something went wrong</h1>
      <p className="text-sm text-ink/50 mb-6">
        {error.message && !error.digest ? error.message : 'That action didn’t go through. Try again, or head back to your dashboard.'}
      </p>
      <div className="flex items-center justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className="text-sm font-medium text-ink/60 hover:text-ink px-3 py-2">
          Dashboard
        </Link>
      </div>
    </div>
  )
}
