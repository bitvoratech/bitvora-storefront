/* eslint-disable @next/next/no-img-element -- Cloudinary-resized images via cldImage() */
import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { PackageBox } from 'switch-icons'
import { IconSearchOff } from '@tabler/icons-react'
import { ProductCard } from './ProductCard'
import { DISPLAY_FONTS, SCALE_CLASSES } from '../../lib/font-pairings'
import { getPublishedStore, whatsappLink } from '../../lib/store'
import { cldImage } from '../../lib/cloudinary-image'
import { ProductFilters } from '../../components/ProductFilters'
import { BrandIcon } from '../../components/BrandIcon'

const PRODUCTS_POSITION = 5

type SearchParams = { q?: string; category?: string; sort?: string }

// Characters with meaning in PostgREST filter syntax or LIKE patterns.
function cleanSearch(raw: string | undefined) {
  return (raw ?? '').replace(/[,()*%\\:"'.]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<SearchParams>
}) {
  const { slug } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const query = cleanSearch(sp.q)
  const category = (sp.category ?? '').slice(0, 80)
  const sort = sp.sort === 'price_asc' || sp.sort === 'price_desc' || sp.sort === 'popular' ? sp.sort : 'newest'
  const isFiltering = !!query || !!category

  const store = await getPublishedStore(slug)
  if (!store) notFound()

  const currentStore = store
  
  const { data: allSections } = await supabase
  .from('sections')
  .select('type, config, position')
  .eq('store_id', store.id)
  .eq('is_visible', true)
  .order('position')

  // All categories in the store (also tells us if the store has any products).
  const { data: allProducts } = await supabase
    .from('products')
    .select('category')
    .eq('store_id', store.id)
    .eq('is_active', true)
  const totalProducts = allProducts?.length ?? 0
  // Case-insensitive: "Jewelry" and "jewelry" are one chip (chips render
  // capitalised, so two would look identical but each show half the items).
  const categoryByKey = new Map<string, string>()
  for (const p of allProducts ?? []) {
    const c = p.category?.trim()
    if (c && !categoryByKey.has(c.toLowerCase())) categoryByKey.set(c.toLowerCase(), c)
  }
  const categories = [...categoryByKey.values()].sort((a, b) => a.localeCompare(b))

  let productQuery = supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('is_active', true)

  // Every word must match somewhere (name, description or category), so
  // "red ankara dress" narrows results instead of widening them.
  for (const word of query.split(' ').filter(Boolean).slice(0, 5)) {
    productQuery = productQuery.or(`name.ilike.%${word}%,description.ilike.%${word}%,category.ilike.%${word}%`)
  }
  // ilike with no wildcards = case-insensitive equality; escape LIKE's own
  // wildcards so a category containing % or _ matches literally.
  if (category) productQuery = productQuery.ilike('category', category.replace(/[\\%_]/g, (ch) => `\\${ch}`))

  productQuery =
    sort === 'price_asc'
      ? productQuery.order('price', { ascending: true })
      : sort === 'price_desc'
        ? productQuery.order('price', { ascending: false })
        : productQuery.order('created_at', { ascending: false })

  const { data: exactProducts } = await productQuery

  // Real units sold in the last 30 days → bestseller badges + "Best selling" sort.
  const { data: salesRows } = await supabase.rpc('recent_product_sales', { p_store_id: store.id, p_days: 30 })
  const unitsSold = new Map<string, number>(
    ((salesRows as { product_id: string; units: number }[] | null) ?? []).map((r) => [r.product_id, Number(r.units)])
  )
  const bestsellerIds = new Set(
    [...unitsSold.entries()]
      .filter(([, units]) => units >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id)
  )

  // No exact match for a search → fall back to typo-tolerant matching
  // ("ankra" → "Ankara"), keeping any category filter.
  let products = exactProducts ?? []
  let showingSimilar = false
  if (query && products.length === 0) {
    const { data: similar } = await supabase.rpc('similar_products', { p_store_id: store.id, p_query: query, p_limit: 12 })
    const matches = ((similar as typeof products | null) ?? []).filter((p) => !category || p.category?.trim().toLowerCase() === category.toLowerCase())
    if (matches.length > 0) {
      products = matches
      showingSimilar = true
    }
  }

  if (sort === 'popular') {
    products = [...products].sort((a, b) => (unitsSold.get(b.id) ?? 0) - (unitsSold.get(a.id) ?? 0))
  }

  const accent = store.palette?.primary || '#171717'
  const typography = store.typography || { pairing: 'editorial', scale: 'standard' }
  const displayFont = DISPLAY_FONTS[typography.pairing ?? 'editorial'] || DISPLAY_FONTS.editorial
  const scale = SCALE_CLASSES[typography.scale ?? 'standard'] || SCALE_CLASSES.standard
  // The product grid sits at position 5: sections the merchant orders above it
  // render before the products, the rest after. Any section type can go either
  // side, so reordering in the admin never makes a section disappear.
  const beforeProducts = (allSections || []).filter((s) => s.position < PRODUCTS_POSITION)
  const afterProducts = (allSections || []).filter((s) => s.position >= PRODUCTS_POSITION)

  // Two columns on phones (the shopping norm); density only widens larger screens.
  const gridCols = store.grid_density === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'
  const productCount = products?.length ?? 0

function renderSection(section: { type: string; config: unknown }) {
  if (section.type === 'hero') {
    const h = section.config as { heading?: string; subheading?: string; image_url?: string; cta_text?: string }
    return (
      <div key="hero" className="relative -mx-4 sm:-mx-6 mb-12 sm:mb-16 h-[380px] sm:h-[520px] overflow-hidden">
        {h.image_url ? (
          <img src={cldImage(h.image_url, 1600)} alt="" fetchPriority="high" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: accent }} />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/20 to-transparent" />
        <div className="relative h-full flex flex-col justify-center px-8 sm:px-16 max-w-xl">
          <h1 className={`${scale.hero} text-white leading-[1.05] mb-4`} style={{ fontFamily: displayFont, fontWeight: 600 }}>
            {h.heading || currentStore.name}
          </h1>
          {(h.subheading || !h.heading) && (
            <p className="text-white/80 text-base sm:text-lg mb-6 max-w-md">
              {h.subheading || (currentStore.industry
                ? `Shop ${currentStore.name}'s ${currentStore.industry} collection.`
                : `Welcome to ${currentStore.name}.`)}
            </p>
          )}
          <a href="#products" className="inline-block w-fit rounded-full px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: accent }}>
            {h.cta_text || 'Shop now'}
          </a>
        </div>
      </div>
    )
  }

  if (section.type === 'banner_grid') {
    const tiles = ((section.config as { tiles?: { heading: string; image_url: string; cta_text: string }[] })?.tiles || []).filter((t) => t.heading)
    if (tiles.length === 0) return null
    return (
      // Phones: a swipeable row of shorter tiles, so shoppers reach products
      // without scrolling past three full-height blocks. Larger screens: grid.
      <div
        key="banner_grid"
        className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-12 sm:mb-16 flex sm:grid sm:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {tiles.map((tile, i) => (
          <div key={i} className="relative shrink-0 w-[78%] sm:w-auto snap-start h-[200px] sm:h-[280px] rounded-2xl overflow-hidden">
            {tile.image_url ? (
              <img src={cldImage(tile.image_url, 800)} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ backgroundColor: accent }} />
            )}
            <div className="absolute inset-0 bg-black/35" />
            <div className="relative h-full flex flex-col justify-end p-5">
              <p className={`${scale.tile} text-white mb-3 leading-tight`} style={{ fontFamily: displayFont, fontWeight: 600 }}>
                {tile.heading}
              </p>
              <a href="#products" className="inline-block w-fit rounded-full bg-white text-[#171717] px-4 py-2 text-xs font-medium hover:opacity-90 transition-opacity">
                {tile.cta_text || 'Shop now'}
              </a>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (section.type === 'about') {
    const a = section.config as { heading?: string; body?: string }
    if (!a.heading) return null
    return (
      <div key="about" className="mb-16 max-w-2xl">
        <h2 className={`${scale.section} mb-3`} style={{ fontFamily: displayFont, fontWeight: 600 }}>{a.heading}</h2>
        <p className="text-[#525252] leading-relaxed whitespace-pre-line">{a.body}</p>
      </div>
    )
  }

  if (section.type === 'cta_banner') {
    const c = section.config as { heading?: string; image_url?: string; cta_text?: string }
    if (!c.heading) return null
    return (
      <div key="cta_banner" className="relative -mx-4 sm:-mx-6 mt-12 sm:mt-16 h-[240px] sm:h-[340px] overflow-hidden">
        {c.image_url ? (
          <img src={cldImage(c.image_url, 1600)} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: accent }} />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-8">
          <h2 className={`${scale.cta} text-white capitalize leading-snug mb-6 max-w-4xl font-bold`} style={{ fontFamily: displayFont }}>
            {c.heading}
          </h2>
          <a href="#products" className="inline-block rounded-full px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: accent }}>
            {c.cta_text || 'Shop now'}
          </a>
        </div>
      </div>
    )
  }

  return null
}

const askLink = query
  ? whatsappLink(store.social_links, `Hi ${store.name}, do you have "${query}"?`)
  : null
const resultLabel = showingSimilar
  ? `No exact matches for “${query}” — showing similar items`
  : query
    ? `${productCount} ${productCount === 1 ? 'result' : 'results'} for “${query}”${category ? ` in ${category}` : ''}`
    : `${productCount} ${productCount === 1 ? 'item' : 'items'} in ${category}`

return (
  <div>
    {/* While searching or filtering, get the marketing sections out of the way. */}
    {!isFiltering && beforeProducts.map(renderSection)}

    <div id="products" className="scroll-mt-28">
      {isFiltering ? (
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
          <h1 className="text-lg sm:text-xl font-semibold" aria-live="polite">{resultLabel}</h1>
          <Link href={`/${slug}`} className="text-sm underline text-[#525252] hover:text-[#171717]">
            Clear all
          </Link>
        </div>
      ) : (
        <div className="text-center mb-8">
          <h2 className={`${scale.section} mb-2`} style={{ fontFamily: displayFont, fontWeight: 600 }}>
            Shop {store.name}
          </h2>
          {totalProducts > 0 && (
            <p className="text-[#737373] text-sm">
              {totalProducts} {totalProducts === 1 ? 'item' : 'items'}
            </p>
          )}
        </div>
      )}

      {totalProducts > 0 && (
        <Suspense>
          <ProductFilters slug={slug} categories={categories} accent={accent} />
        </Suspense>
      )}
    </div>

    {totalProducts === 0 && (
      <div className="text-center py-20">
        <PackageBox className="w-8 h-8 text-[#d4d4d4] mx-auto mb-3" />
        <p className="text-[#737373]">No products available yet. Check back soon.</p>
      </div>
    )}

    {totalProducts > 0 && productCount === 0 && (
      <div className="text-center py-16 max-w-sm mx-auto">
        <IconSearchOff className="w-8 h-8 text-[#a3a3a3] mx-auto mb-3" stroke={1.5} />
        <p className="font-medium mb-1">Nothing matches {query ? `“${query}”` : 'that filter'}</p>
        <p className="text-sm text-[#737373] mb-5">
          {query ? 'Try a shorter word, check the spelling, or browse everything.' : 'Nothing here right now — browse everything instead.'}
        </p>
        <div className="flex flex-col gap-2 items-center">
          <Link
            href={`/${slug}`}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: accent }}
          >
            Browse all products
          </Link>
          {askLink && (
            <a
              href={askLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] px-5 py-2.5 text-sm font-medium hover:bg-[#fafafa] transition-colors"
            >
              <BrandIcon icon="Whatsapp" className="w-4 h-4" />
              Ask {store.name} if they have it
            </a>
          )}
        </div>
      </div>
    )}

    <div className={`grid ${gridCols} gap-3 sm:gap-5`}>
      {products?.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          storeSlug={slug}
          accent={accent}
          badge={bestsellerIds.has(product.id) ? 'Bestseller' : undefined}
        />
      ))}
    </div>

    {!isFiltering && afterProducts.map(renderSection)}
  </div>
)
}
