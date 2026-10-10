'use client'

import { useState, useTransition } from 'react'
import { Trash } from 'switch-icons'
import { deleteProduct } from './actions'

// Two-step delete: the first click asks, the second deletes. Deleting is
// permanent, so a stray tap on a phone shouldn't remove a product.
export function DeleteProductButton({ productId, storeId, productName }: { productId: string; storeId: string; productName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState(false)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${productName}`}
        title="Delete"
        className="p-2 text-ink/40 hover:text-pepper-600 hover:bg-pepper-50 rounded-lg transition-colors"
      >
        <Trash className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label={`Confirm deleting ${productName}`}>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await deleteProduct(productId, storeId)
            } catch {
              setError(true)
              setConfirming(false)
            }
          })
        }
        className="text-xs font-medium rounded-md px-2 py-1.5 bg-pepper-600 text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirming(false)}
        className="text-xs font-medium rounded-md px-2 py-1.5 text-ink/60 hover:bg-sand-100 dark:hover:bg-sand-200"
      >
        Cancel
      </button>
      {error && <span className="sr-only" role="alert">Could not delete the product.</span>}
    </div>
  )
}
