'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { Edit, PackageBox } from 'switch-icons'
import { IconBell, IconPhotoDown } from '@tabler/icons-react'
import { DeleteProductButton } from './DeleteProductButton'
import { cldImage } from '../../../../lib/cloudinary-image'
import { IconSearch } from '@tabler/icons-react'

type Product = {
  id: string
  slug: string
  name: string
  price: number
  stock_quantity: number
  category: string | null
  is_active: boolean
  images: string[] | null
}

function stockBadge(stock: number) {
  if (stock <= 0) return { label: 'Out of stock', className: 'bg-pepper-50 text-pepper-600' }
  if (stock < 5) return { label: 'Low stock', className: 'bg-marigold-50 text-marigold-500' }
  return null
}

export function ProductsTable({
  storeId,
  products,
  storeUrl,
  waitingByProduct = {},
}: {
  storeId: string
  products: Product[]
  /** Public store URL, or null when the storefront URL isn't configured. */
  storeUrl: string | null
  waitingByProduct?: Record<string, number>
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean) as string[])
    return ['all', ...set]
  }, [products])

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'all' || p.category === category
    return matchesSearch && matchesCategory
  })

  if (products.length === 0) {
    return (
      <Card className="text-center py-14">
        <PackageBox className="w-8 h-8 text-ink/20 mx-auto mb-3" />
        <p className="text-ink/50 mb-3">No products yet.</p>
        <Link href={`/stores/${storeId}/products/new`} className="text-indigo-600 font-medium text-sm">
          Add your first product →
        </Link>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" stroke={1.75} />
          <input
            type="text"
            placeholder="Search products…"
            aria-label="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-sand-200 bg-white dark:bg-sand-100 focus:outline-none focus:border-indigo-600"
          />
        </div>
        {categories.length > 1 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="text-sm rounded-lg border border-sand-200 bg-white dark:bg-sand-100 px-3 py-2 capitalize focus:outline-none focus:border-indigo-600"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-ink/50">No products match your search.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-sand-100 text-xs font-semibold uppercase tracking-wide text-ink/50">
            <span>Product</span>
            <span>Price</span>
            <span>Stock</span>
            <span className="sr-only">Actions</span>
          </div>
          {filtered.map((product, i) => {
            const badge = stockBadge(product.stock_quantity)
            return (
              <div
                key={product.id}
                className={`flex items-center justify-between gap-3 px-4 py-3 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:items-center ${
                  i !== filtered.length - 1 ? 'border-b border-sand-200' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cldImage(product.images[0], 120)} alt="" loading="lazy" className="w-10 h-10 object-cover rounded-lg shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-sand-100 flex items-center justify-center shrink-0">
                      <PackageBox className="w-4 h-4 text-ink/20" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    {!product.is_active && (
                      <p className="text-xs text-pepper-600">Inactive</p>
                    )}
                    {(waitingByProduct[product.id] ?? 0) > 0 && (
                      <Link
                        href={`/stores/${storeId}/products/${product.id}/edit#restock`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                      >
                        <IconBell className="w-3 h-3" stroke={2} />
                        {waitingByProduct[product.id]} waiting for restock
                      </Link>
                    )}
                  </div>
                </div>

                <p className="font-mono text-sm hidden sm:block">₦{Number(product.price).toLocaleString()}</p>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="font-mono text-sm text-ink/60">{product.stock_quantity}</span>
                  {badge && (
                    <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-mono text-sm sm:hidden mr-1">₦{Number(product.price).toLocaleString()}</span>
                  {storeUrl && product.is_active && (
                    // Ready-made 1080×1920 image for the merchant's WhatsApp Status.
                    <a
                      href={`${storeUrl}/product/${product.slug}/status-image?download=1`}
                      aria-label={`Download WhatsApp Status image for ${product.name}`}
                      title="Status image"
                      className="p-2 text-ink/40 hover:text-palm-600 hover:bg-palm-50 rounded-lg transition-colors"
                    >
                      <IconPhotoDown className="w-4 h-4" stroke={1.75} />
                    </a>
                  )}
                  <Link
                    href={`/stores/${storeId}/products/${product.id}/edit`}
                    aria-label={`Edit ${product.name}`}
                    title="Edit"
                    className="p-2 text-ink/40 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <DeleteProductButton productId={product.id} storeId={storeId} productName={product.name} />
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}