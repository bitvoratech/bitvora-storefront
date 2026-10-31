'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { IconBell, IconEdit, IconEyeOff, IconPackage, IconPhotoDown } from '@tabler/icons-react'
import { DeleteProductButton } from './DeleteProductButton'
import { cldImage } from '@bitvora/lib/cloudinary-image'
import { IconSearch } from '@tabler/icons-react'

type Product = {
  id: string
  slug: string
  name: string
  price: number
  stock_quantity: number
  /** false: made to order, never sells out. */
  track_stock?: boolean | null
  category: string | null
  is_active: boolean
  images: string[] | null
  created_at?: string
}

const LOW_STOCK = 5

const tracked = (p: Product) => p.track_stock !== false

function stockBadge(p: Product) {
  if (!tracked(p)) return null
  const stock = p.stock_quantity
  if (stock <= 0) return { label: 'Out of stock', className: 'bg-pepper-50 text-pepper-600' }
  if (stock < LOW_STOCK) return { label: 'Low stock', className: 'bg-marigold-50 text-marigold-500' }
  return null
}

const STOCK_FILTERS = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'low', label: 'Low stock', test: (p: Product) => tracked(p) && p.stock_quantity > 0 && p.stock_quantity < LOW_STOCK },
  { key: 'out', label: 'Out of stock', test: (p: Product) => tracked(p) && p.stock_quantity <= 0 },
  { key: 'hidden', label: 'Hidden', test: (p: Product) => !p.is_active },
] as const

type StockFilter = (typeof STOCK_FILTERS)[number]['key']

// Untracked products never run out, so they sort after every counted one.
const stockRank = (p: Product) => (tracked(p) ? p.stock_quantity : Number.POSITIVE_INFINITY)

const SORTS = {
  newest: { label: 'Newest first', compare: () => 0 },
  name: { label: 'Name A–Z', compare: (a: Product, b: Product) => a.name.localeCompare(b.name) },
  price_asc: { label: 'Price: low to high', compare: (a: Product, b: Product) => a.price - b.price },
  price_desc: { label: 'Price: high to low', compare: (a: Product, b: Product) => b.price - a.price },
  stock: { label: 'Stock: lowest first', compare: (a: Product, b: Product) => stockRank(a) - stockRank(b) },
} as const

type SortKey = keyof typeof SORTS

const naira = (n: number) => `₦${Number(n).toLocaleString()}`

const selectClass =
  'min-w-0 text-base sm:text-sm rounded-lg border border-sand-200 bg-white dark:bg-sand-100 px-3 py-2 focus:outline-none focus:border-indigo-600'

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
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [sort, setSort] = useState<SortKey>('newest')

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean) as string[])
    return ['all', ...set]
  }, [products])

  const stockCounts = useMemo(() => {
    const c = {} as Record<StockFilter, number>
    for (const f of STOCK_FILTERS) c[f.key] = products.filter(f.test).length
    return c
  }, [products])

  const stockTest = STOCK_FILTERS.find((f) => f.key === stockFilter)!.test
  const q = search.trim().toLowerCase()
  // Products arrive newest first, so "newest" keeps that order.
  const filtered = products
    .filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q)
      const matchesCategory = category === 'all' || p.category === category
      return matchesSearch && matchesCategory && stockTest(p)
    })
    .sort(SORTS[sort].compare)

  if (products.length === 0) {
    return (
      <Card className="text-center py-14 px-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <IconPackage className="w-6 h-6 text-indigo-600" />
        </div>
        <p className="font-display font-semibold mb-1">Add your first product</p>
        <p className="text-sm text-ink/50 mb-5 max-w-xs mx-auto">Add a photo, a price and how many you have. It shows on your store straight away.</p>
        <Link
          href={`/stores/${storeId}/products/new`}
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Add product
        </Link>
      </Card>
    )
  }

  const filtersActive = q || category !== 'all' || stockFilter !== 'all'

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" stroke={1.75} />
          <input
            type="search"
            placeholder="Search products…"
            aria-label="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-base sm:text-sm rounded-lg border border-sand-200 bg-white dark:bg-sand-100 focus:outline-none focus:border-indigo-600"
          />
        </div>
        <div className="flex gap-2">
          {categories.length > 1 && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className={`${selectClass} flex-1 capitalize`}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
              ))}
            </select>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort products"
            className={`${selectClass} flex-1`}
          >
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* One scrolling row on a phone instead of chips wrapping onto several lines. */}
      <div className="flex gap-1.5 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STOCK_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStockFilter(f.key)}
            aria-pressed={stockFilter === f.key}
            className={`shrink-0 whitespace-nowrap text-xs rounded-full px-3 py-1.5 font-medium border transition-colors ${
              stockFilter === f.key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : f.key === 'out' && stockCounts.out > 0
                  ? 'border-pepper-600/30 text-pepper-600 hover:border-pepper-600'
                  : f.key === 'low' && stockCounts.low > 0
                    ? 'border-marigold-500/40 text-marigold-500 hover:border-marigold-500'
                    : 'border-sand-200 text-ink/60 hover:border-indigo-600'
            }`}
          >
            {f.label} <span className="opacity-60">{stockCounts[f.key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-ink/50 mb-2">No products match.</p>
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setCategory('all')
                setStockFilter('all')
              }}
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_7rem_9rem_7rem] gap-4 px-4 py-2.5 bg-sand-100 text-xs font-semibold uppercase tracking-wide text-ink/50">
            <span>Product</span>
            <span>Price</span>
            <span>Stock</span>
            <span className="sr-only">Actions</span>
          </div>
          {filtered.map((product, i) => {
            const badge = stockBadge(product)
            const editHref = `/stores/${storeId}/products/${product.id}/edit`
            const waiting = waitingByProduct[product.id] ?? 0
            return (
              <div
                key={product.id}
                className={`flex items-center gap-3 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_7rem_9rem_7rem] sm:gap-4 ${
                  i !== filtered.length - 1 ? 'border-b border-sand-200' : ''
                } ${product.is_active ? '' : 'bg-sand-100/40'}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Link href={editHref} className="shrink-0" tabIndex={-1} aria-hidden="true">
                    {product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cldImage(product.images[0], 160)}
                        alt=""
                        loading="lazy"
                        className={`w-14 h-14 sm:w-11 sm:h-11 object-cover rounded-lg ${product.is_active ? '' : 'opacity-50'}`}
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-11 sm:h-11 rounded-lg bg-sand-100 flex items-center justify-center">
                        <IconPackage className="w-4 h-4 text-ink/20" />
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <Link href={editHref} className="block font-medium text-sm truncate hover:text-indigo-600">
                      {product.name}
                    </Link>
                    {/* Price and stock live in their own columns from sm up. */}
                    <p className="sm:hidden text-xs text-ink/60 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      <span className="font-mono text-ink">{naira(product.price)}</span>
                      <span aria-hidden="true">·</span>
                      {badge ? (
                        <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${badge.className}`}>
                          {product.stock_quantity > 0 ? `${product.stock_quantity} left` : badge.label}
                        </span>
                      ) : (
                        <span>{tracked(product) ? `${product.stock_quantity} in stock` : 'Always available'}</span>
                      )}
                    </p>
                    {(!product.is_active || waiting > 0 || product.category) && (
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs">
                        {!product.is_active && (
                          <span className="inline-flex items-center gap-1 text-ink/50">
                            <IconEyeOff className="w-3 h-3" stroke={2} /> Hidden from store
                          </span>
                        )}
                        {waiting > 0 && (
                          <Link href={`${editHref}#restock`} className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline">
                            <IconBell className="w-3 h-3" stroke={2} />
                            {waiting} waiting
                          </Link>
                        )}
                        {product.category && product.is_active && waiting === 0 && (
                          <span className="hidden sm:inline text-ink/40 capitalize">{product.category}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <p className="font-mono text-sm hidden sm:block">{naira(product.price)}</p>

                <div className="hidden sm:flex items-center gap-2">
                  {tracked(product) ? (
                    <span className="font-mono text-sm text-ink/60 w-6 text-right">{product.stock_quantity}</span>
                  ) : (
                    <span className="text-xs text-ink/50">Always available</span>
                  )}
                  {badge && (
                    <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 whitespace-nowrap ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end shrink-0 -mr-2 sm:mr-0">
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
                    href={editHref}
                    aria-label={`Edit ${product.name}`}
                    title="Edit"
                    className="p-2 text-ink/40 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <IconEdit className="w-4 h-4" />
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
