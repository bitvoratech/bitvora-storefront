'use client'

import { useState } from 'react'
import { Label } from '@bitvora/ui/src/Label'
import { Input } from '@bitvora/ui/src/Input'
import { IconX } from '@tabler/icons-react'
import { MAX_SIZES, MAX_SIZE_LENGTH, splitSizes } from '../../../../lib/product-sizes'

// Free-form on purpose: a doll seller, a hair seller and a shoe seller all
// measure differently, so the merchant types whatever their sizes are.
// Each size can have its own price (a bigger door costs more); a blank
// price means the size sells at the product's main price.
export function SizesInput({
  initialSizes = [],
  initialSizePrices = {},
}: {
  initialSizes?: string[]
  initialSizePrices?: Record<string, number> | null
}) {
  const [sizes, setSizes] = useState<string[]>(initialSizes)
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initialSizePrices ?? {}).map(([size, price]) => [size, String(price)])),
  )
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
      <input
        type="hidden"
        name="size_prices"
        value={JSON.stringify(Object.fromEntries(sizes.filter((s) => prices[s]?.trim()).map((s) => [s, prices[s].trim()])))}
      />
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
        <>
          <p className="text-xs text-ink/50 mt-3 mb-1.5">
            Different price for a size? Type it in. Leave blank to use the main price.
          </p>
          <ul className="space-y-2" aria-label="Sizes added">
            {sizes.map((size) => (
              <li key={size} className="flex items-center gap-2">
                <span className="flex-1 min-w-0 truncate rounded-full bg-sand-100 px-3 py-1.5 text-sm">{size}</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  aria-label={`Price for size ${size} (₦)`}
                  placeholder="Main price"
                  value={prices[size] ?? ''}
                  onChange={(e) => setPrices((prev) => ({ ...prev, [size]: e.target.value }))}
                  className="font-mono !w-32 shrink-0"
                />
                <button
                  type="button"
                  onClick={() => setSizes((prev) => prev.filter((s) => s !== size))}
                  aria-label={`Remove size ${size}`}
                  className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-ink/50 hover:bg-pepper-50 hover:text-pepper-600"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
