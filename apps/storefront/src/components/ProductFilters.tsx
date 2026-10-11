'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Best selling' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
] as const

// Category chips + sort. State lives in the URL so filtered views survive a
// refresh and can be shared in a WhatsApp chat.
export function ProductFilters({
  slug,
  categories,
  accent,
}: {
  slug: string
  categories: string[]
  accent: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const activeCategory = params.get('category') ?? ''
  const sort = params.get('sort') ?? 'newest'

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    const qs = next.toString()
    router.replace(`/${slug}${qs ? `?${qs}` : ''}#products`, { scroll: false })
  }

  const chips = ['', ...categories]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      {categories.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 [&::-webkit-scrollbar]:hidden flex-1"
          style={{ scrollbarWidth: 'none' }}
          role="group"
          aria-label="Filter by category"
        >
          {chips.map((c) => {
            const selected = c.toLowerCase() === activeCategory.toLowerCase()
            return (
              <button
                key={c || 'all'}
                type="button"
                onClick={() => update('category', c)}
                aria-pressed={selected}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm capitalize transition-colors ${
                  selected ? 'text-white border-transparent' : 'border-[#e5e5e5] text-[#525252] hover:border-[#a3a3a3]'
                }`}
                style={selected ? { backgroundColor: accent } : undefined}
              >
                {c || 'All'}
              </button>
            )
          })}
        </div>
      )}
      <div className="flex items-center gap-2 sm:ml-auto">
        <label htmlFor="product-sort" className="text-sm text-[#737373] shrink-0">Sort</label>
        <select
          id="product-sort"
          value={sort}
          onChange={(e) => update('sort', e.target.value === 'newest' ? '' : e.target.value)}
          className="rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-base sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#171717]"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
