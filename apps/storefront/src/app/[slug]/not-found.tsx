'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Rendered inside the store layout, e.g. for a product that was removed.
// not-found pages don't receive params, so the store slug comes from the URL.
export default function StoreNotFound() {
  const slug = usePathname()?.split('/')[1] ?? ''

  return (
    <div className="text-center py-20 max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-2">We couldn&apos;t find that</h1>
      <p className="text-sm text-[#737373] mb-6">This item may have sold out or been removed.</p>
      <Link href={`/${slug}`} className="text-sm font-medium underline">
        Back to the store
      </Link>
    </div>
  )
}
