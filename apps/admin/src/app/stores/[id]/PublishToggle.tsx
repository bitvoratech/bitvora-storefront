'use client'

import { useTransition } from 'react'
import { toggleStorePublish } from './action';


export function PublishToggle({ storeId, isPublished, className = '' }: { storeId: string; isPublished: boolean; className?: string }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(() => {
      toggleStorePublish(storeId, isPublished)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`text-sm rounded-md px-3 py-1.5 font-medium transition-colors ${
        isPublished
          ? 'bg-sand-100 text-ink/70 hover:bg-sand-200'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      } disabled:opacity-50 ${className}`}
    >
      {isPending ? 'Updating...' : isPublished ? 'Unpublish' : 'Publish store'}
    </button>
  )
}