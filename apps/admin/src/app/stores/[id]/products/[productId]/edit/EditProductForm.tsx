'use client'

import { useActionState } from 'react'
import { updateProduct } from '../../actions'
import { ImageUploader } from '../../ImageUploader'
import { SizesInput } from '../../SizesInput'
import { Button } from '@bitvora/ui/src/Button'
import { Input } from '@bitvora/ui/src/Input'
import { Textarea } from '@bitvora/ui/src/Textarea'
import { Label } from '@bitvora/ui/src/Label'
import { AlertTriangle } from 'switch-icons'

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  stock_quantity: number
  compare_at_price: number | null
  category: string | null
  is_active: boolean
  images: string[] | null
  sizes: string[] | null
}

export function EditProductForm({ product, storeId }: { product: Product; storeId: string }) {
  const boundAction = updateProduct.bind(null, product.id, storeId)
  const [state, formAction, pending] = useActionState(boundAction, undefined)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" type="text" required defaultValue={product.name} />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={product.description ?? ''} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="price">Price (₦)</Label>
          <Input id="price" name="price" type="number" inputMode="decimal" step="0.01" min="0" required defaultValue={product.price} className="font-mono" />
        </div>
        <div>
          <Label htmlFor="stock_quantity">Stock</Label>
          <Input id="stock_quantity" name="stock_quantity" type="number" inputMode="numeric" min="0" defaultValue={product.stock_quantity} className="font-mono" />
        </div>
      </div>
      <SizesInput initialSizes={product.sizes ?? []} />
      <div>
        <Label htmlFor="compare_at_price">Was price (₦) <span className="font-normal text-ink/40">— optional</span></Label>
        <Input id="compare_at_price" name="compare_at_price" type="number" inputMode="decimal" step="0.01" min="0" placeholder="Shows the price as a discount" className="font-mono" defaultValue={product.compare_at_price ?? ''} />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" type="text" defaultValue={product.category ?? ''} />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" name="is_active" defaultChecked={product.is_active} className="rounded border-sand-200 text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600" />
        Active (visible on storefront)
      </label>
      <ImageUploader initialImages={product.images ?? []} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  )
}