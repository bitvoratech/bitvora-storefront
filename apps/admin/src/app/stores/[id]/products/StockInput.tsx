'use client'

import { useState } from 'react'
import { Label } from '@bitvora/ui/src/Label'
import { Input } from '@bitvora/ui/src/Input'

// Some products are made to order or always available (doors, blocks,
// roofing sheets...), so the merchant can switch stock counting off. Such a
// product never sells out and orders don't count it down.
export function StockInput({ initialStock, initialTrackStock = true }: { initialStock?: number; initialTrackStock?: boolean }) {
  const [trackStock, setTrackStock] = useState(initialTrackStock)

  return (
    <div>
      <input type="hidden" name="track_stock" value={trackStock ? 'on' : 'off'} />
      <Label htmlFor="stock_quantity">Stock</Label>
      {trackStock ? (
        // Starting at 0 marked every new product sold out; make the count a deliberate choice.
        <Input
          id="stock_quantity"
          name="stock_quantity"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          required
          placeholder="How many?"
          defaultValue={initialStock}
          className="font-mono"
        />
      ) : (
        <p className="rounded-lg border border-dashed border-sand-200 px-3 py-2.5 text-base sm:text-sm text-ink/50">Always available</p>
      )}
      <label className="flex items-center gap-2 text-xs text-ink/60 mt-1.5">
        <input
          type="checkbox"
          checked={!trackStock}
          onChange={(e) => setTrackStock(!e.target.checked)}
          className="rounded border-sand-200 text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600"
        />
        Don&apos;t count stock (made to order)
      </label>
    </div>
  )
}
