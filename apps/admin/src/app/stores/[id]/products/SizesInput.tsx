'use client'

import { useState } from 'react'
import { Label } from '@bitvora/ui/src/Label'
import { Input } from '@bitvora/ui/src/Input'
import { IconX } from '@tabler/icons-react'
import { MAX_SIZES, MAX_SIZE_LENGTH, splitSizes } from '../../../../lib/product-sizes'

// Free-form on purpose: a doll seller, a hair seller and a shoe seller all
// measure differently, so the merchant types whatever their sizes are.
export function SizesInput({ initialSizes = [] }: { initialSizes?: string[] }) {
  const [sizes, setSizes] = useState<string[]>(initialSizes)
  const [draft, setDraft] = useState('')

  function add() {
    const next = [...sizes]
    for (const size of splitSizes(draft)) {
      if (next.length >= MAX_SIZES) break
      if (!next.some((s) => s.toLowerCase() === size.toLowerCase())) next.push(size.slice(0, MAX_SIZE_LENGTH))
    }
    setSizes(next)
    setDraft('')
  }

  return (
    <div>
      <input type="hidden" name="sizes" value={JSON.stringify(sizes)} />
      <Label htmlFor="size-draft">Sizes <span className="font-normal text-ink/40">— optional</span></Label>
      <div className="flex gap-2">
        <Input
          id="size-draft"
          type="text"
          value={draft}
          maxLength={200}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter adds the size instead of submitting the whole form.
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          onBlur={() => draft.trim() && add()}
          placeholder="e.g. 16 inches, 42, XL"
          disabled={sizes.length >= MAX_SIZES}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="shrink-0 rounded-lg border border-sand-200 px-4 text-sm font-medium hover:border-indigo-600 hover:text-indigo-600 transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-ink/50 mt-1.5">
        Leave empty if this product has one size. Customers will pick one before ordering.
      </p>

      {sizes.length > 0 && (
        <ul className="flex flex-wrap gap-2 mt-3" aria-label="Sizes added">
          {sizes.map((size) => (
            <li key={size} className="inline-flex items-center gap-1 rounded-full bg-sand-100 pl-3 pr-1 py-1 text-sm">
              {size}
              <button
                type="button"
                onClick={() => setSizes((prev) => prev.filter((s) => s !== size))}
                aria-label={`Remove size ${size}`}
                className="w-6 h-6 rounded-full flex items-center justify-center text-ink/50 hover:bg-pepper-50 hover:text-pepper-600"
              >
                <IconX className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
