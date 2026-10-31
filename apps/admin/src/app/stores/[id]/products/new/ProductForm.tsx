'use client'

import { useActionState } from 'react'
import { createProduct } from '../actions'
import { ImageUploader } from '../ImageUploader'
import { SizesInput } from '../SizesInput'
import { StockInput } from '../StockInput'
import { Button } from '@bitvora/ui/src/Button'
import { Input } from '@bitvora/ui/src/Input'
import { Textarea } from '@bitvora/ui/src/Textarea'
import { Label } from '@bitvora/ui/src/Label'
import { IconAlertTriangle } from '@tabler/icons-react'

export function ProductForm({ storeId }: { storeId: string }) {
  const boundAction = createProduct.bind(null, storeId)
  const [state, formAction, pending] = useActionState(boundAction, undefined)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2">
          <IconAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" type="text" required minLength={2} />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3 items-start">
        <div>
          <Label htmlFor="price">Price (₦)</Label>
          <Input id="price" name="price" type="number" inputMode="decimal" step="0.01" min="0" required className="font-mono" />
        </div>
        <StockInput />
      </div>
      <SizesInput />
      <div>
        <Label htmlFor="compare_at_price">Was price (₦) <span className="font-normal text-ink/40">— optional</span></Label>
        <Input id="compare_at_price" name="compare_at_price" type="number" inputMode="decimal" step="0.01" min="0" placeholder="Shows the price as a discount" className="font-mono" />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" type="text" placeholder="e.g. Dresses" />
      </div>
      <ImageUploader />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Adding product...' : 'Add product'}
      </Button>
    </form>
  )
}