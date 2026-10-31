import { ProductForm } from './ProductForm'
import { Card } from '@bitvora/ui/src/Card'
import Link from 'next/link'
import { IconArrowLeft, IconLock } from '@tabler/icons-react'
import { Button } from '@bitvora/ui/src/Button'
import { createClient } from '../../../../../lib/supabase/server'
import { storePlan } from '../../../../../lib/store-plan'
import { productLimitMessage, underProductLimit } from '../../../../../lib/plans'

export default async function NewProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params
  const supabase = await createClient()
  const plan = await storePlan(supabase, storeId)
  const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeId)
  const atLimit = !underProductLimit(plan, count ?? 0)

  return (
    <div className="max-w-md">
      <Link href={`/stores/${storeId}/products`} className="flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink mb-4">
        <IconArrowLeft className="w-4 h-4" />
        Back to products
      </Link>
      <h1 className="text-2xl font-display font-semibold mb-6">Add product</h1>
      <Card>
        {atLimit ? (
          // Opened directly (the Add product buttons show a popup instead).
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <IconLock className="w-5 h-5 text-indigo-600" stroke={1.75} />
            </div>
            <p className="font-display font-semibold mb-1.5">Upgrade to add more products</p>
            <p className="text-sm text-ink/60 mb-5">{productLimitMessage(plan)}</p>
            <Link href="/billing">
              <Button>See plans &amp; upgrade</Button>
            </Link>
          </div>
        ) : (
          <ProductForm storeId={storeId} />
        )}
      </Card>
    </div>
  )
}