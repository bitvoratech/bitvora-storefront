import { createClient } from '../../../../lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublishToggle } from '../PublishToggle'
import { CustomizeWorkspace } from './CustomizeWorkspace'
import { normalizeAbout } from '@bitvora/lib/about-section'
import { DEFAULT_GRID_DENSITY, DEFAULT_TYPOGRAPHY, hasFullCustomization } from '@bitvora/lib/plan-features'
import { storePlan } from '../../../../lib/store-plan'

const SECTION_LABELS: Record<string, string> = {
  hero: 'Homepage hero',
  about: 'About section',
  banner_grid: 'Featured collections',
  cta_banner: 'Closing banner',
}

export default async function CustomizePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: store, error } = await supabase.from('stores').select('*').eq('id', id).single()
  if (error || !store) notFound()

  const fullCustomization = hasFullCustomization(await storePlan(supabase, id))

  const { data: allSections } = await supabase
    .from('sections').select('type, config, is_visible, position').eq('store_id', id).order('position')

  // The categories merchants already typed on their products: what a
  // collection tile can link to. Case-insensitive, like the storefront chips.
  const { data: productRows } = await supabase.from('products').select('category').eq('store_id', id)
  const categoryByKey = new Map<string, string>()
  for (const p of productRows ?? []) {
    const c = p.category?.trim()
    if (c && !categoryByKey.has(c.toLowerCase())) categoryByKey.set(c.toLowerCase(), c)
  }
  const productCategories = [...categoryByKey.values()].sort((a, b) => a.localeCompare(b))

  const heroSection = allSections?.find((s) => s.type === 'hero')
  const bannerGridSection = allSections?.find((s) => s.type === 'banner_grid')
  const ctaSection = allSections?.find((s) => s.type === 'cta_banner')
  const aboutSection = allSections?.find((s) => s.type === 'about')

  const heroConfig = (heroSection?.config as { heading?: string; subheading?: string; image_url?: string; cta_text?: string }) || {}
  const bannerGridTiles = (bannerGridSection?.config as { tiles?: { heading: string; image_url: string; cta_text: string; category?: string }[] })?.tiles || []
  const ctaConfig = (ctaSection?.config as { heading?: string; image_url?: string; cta_text?: string }) || {}

  const sectionsMeta = (allSections || [])
    .filter((s) => SECTION_LABELS[s.type])
    .map((s) => ({ type: s.type, label: SECTION_LABELS[s.type], is_visible: s.is_visible, position: s.position }))

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold mb-1">Customize</h1>
          <p className="text-ink/50 text-sm">Brand color and homepage content for {store.name}.</p>
        </div>
        <PublishToggle storeId={store.id} isPublished={store.is_published} />
      </div>

      <CustomizeWorkspace
        storeId={store.id}
        storeName={store.name}
        initialColor={store.palette?.primary || '#171717'}
        initialHero={{
          heading: heroConfig.heading || '',
          subheading: heroConfig.subheading || '',
          image_url: heroConfig.image_url || '',
          cta_text: heroConfig.cta_text || '',
        }}
        initialTiles={bannerGridTiles}
        productCategories={productCategories}
        initialCta={{
          heading: ctaConfig.heading || '',
          image_url: ctaConfig.image_url || '',
          cta_text: ctaConfig.cta_text || '',
        }}
        initialLogo={store.logo_url || ''}
        // Starter stores render with the defaults, whatever was saved before.
        initialTypography={(fullCustomization && store.typography) || { ...DEFAULT_TYPOGRAPHY }}
        initialGridDensity={(fullCustomization && store.grid_density) || DEFAULT_GRID_DENSITY}
        initialAbout={normalizeAbout(aboutSection?.config)}
        initialSocial={store.social_links || {}}
        sectionsMeta={sectionsMeta}
        fullCustomization={fullCustomization}
      />
    </div>
  )
}