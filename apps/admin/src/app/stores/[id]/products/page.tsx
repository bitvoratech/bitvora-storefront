import { Button } from '@bitvora/ui/src/Button'
import { Plus } from 'switch-icons'
import { createClient } from '../../../../lib/supabase/server'
import { ProductsTable } from './Productstable'
import { storefrontUrl } from '../../../../lib/storefront-url'
import { storePlan } from '../../../../lib/store-plan'
import { productLimitMessage, underProductLimit } from '../../../../lib/plans'
import { UpgradeGate } from '../../../../components/UpgradeGate'

export default async function ProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  const { data: store } = await supabase.from('stores').select('slug').eq('id', storeId).single()
  const plan = await storePlan(supabase, storeId)

  // Shoppers waiting on a restock, per product.
  const { data: waiting } = await supabase
    .from('restock_requests')
    .select('product_id')
    .eq('store_id', storeId)
    .is('notified_at', null)
  const waitingByProduct: Record<string, number> = {}
  for (const w of waiting ?? []) waitingByProduct[w.product_id] = (waitingByProduct[w.product_id] ?? 0) + 1

  const soldOut = (products ?? []).filter((p) => p.stock_quantity <= 0).length

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-1">
        <h1 className="text-2xl font-display font-semibold">Products</h1>
        <UpgradeGate
          href={`/stores/${storeId}/products/new`}
          locked={!underProductLimit(plan, products?.length ?? 0)}
          title="Upgrade to add more products"
          message={productLimitMessage(plan)}
        >
          <Button className="gap-1.5">
            <Plus className="w-4 h-4" />
            Add product
          </Button>
        </UpgradeGate>
      </div>
      <p className="text-ink/50 text-sm mb-4 sm:mb-6">
        {products?.length ?? 0} product{products?.length === 1 ? '' : 's'}
        {soldOut > 0 && <span className="text-pepper-600"> · {soldOut} sold out</span>}
      </p>

      <ProductsTable
        storeId={storeId}
        products={products ?? []}
        storeUrl={store ? storefrontUrl(store.slug) : null}
        waitingByProduct={waitingByProduct}
      />
    </div>
  )
}