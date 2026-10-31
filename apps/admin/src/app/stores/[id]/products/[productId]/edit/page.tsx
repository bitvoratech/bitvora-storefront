
import { EditProductForm } from './EditProductForm'
import { Card } from '@bitvora/ui/src/Card'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { IconArrowLeft } from '@tabler/icons-react'
import { createClient } from '../../../../../../lib/supabase/server'
import { storefrontUrl } from '../../../../../../lib/storefront-url'
import { RestockRequests } from './RestockRequests'

export default async function EditProductPage({ params }: { params: Promise<{ id: string; productId: string }> }) {
  const { id: storeId, productId } = await params
  const supabase = await createClient()

  const { data: product } = await supabase.from('products').select('*').eq('id', productId).eq('store_id', storeId).single()

  if (!product) notFound()

  const { data: store } = await supabase.from('stores').select('name, slug').eq('id', storeId).single()
  const { data: restockRequests } = await supabase
    .from('restock_requests')
    .select('id, customer_name, customer_phone, created_at')
    .eq('product_id', productId)
    .is('notified_at', null)
    .order('created_at', { ascending: true })
  const storeUrl = store ? storefrontUrl(store.slug) : null

  return (
    <div className="max-w-md">
      <Link href={`/stores/${storeId}/products`} className="flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink mb-4">
        <IconArrowLeft className="w-4 h-4" />
        Back to products
      </Link>
      <h1 className="text-2xl font-display font-semibold mb-6">Edit product</h1>
      <Card>
        <EditProductForm product={product} storeId={storeId} />
      </Card>
      <RestockRequests
        storeId={storeId}
        productId={product.id}
        productName={product.name}
        storeName={store?.name ?? 'our store'}
        productUrl={storeUrl ? `${storeUrl}/product/${product.slug}` : null}
        inStock={(product.stock_quantity ?? 0) > 0}
        requests={restockRequests ?? []}
      />
    </div>
  )
}