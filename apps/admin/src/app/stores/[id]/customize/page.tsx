import { createClient } from '../../../../lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublishToggle } from '../PublishToggle'
import { CustomizeWorkspace } from './CustomizeWorkspace'
import { normalizeAbout } from '@bitvora/lib/about-section'

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

  const { data: allSections } = await supabase
    .from('sections').select('type, config, is_visible, position').eq('store_id', id).order('position')

  const heroSection = allSections?.find((s) => s.type === 'hero')
  const bannerGridSection = allSections?.find((s) => s.type === 'banner_grid')
  const ctaSection = allSections?.find((s) => s.type === 'cta_banner')
  const aboutSection = allSections?.find((s) => s.type === 'about')

  const heroConfig = (heroSection?.config as { heading?: string; subheading?: string; image_url?: string; cta_text?: string }) || {}
  const bannerGridTiles = (bannerGridSection?.config as { tiles?: { heading: string; image_url: string; cta_text: string }[] })?.tiles || []
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
        initialCta={{
          heading: ctaConfig.heading || '',
          image_url: ctaConfig.image_url || '',
          cta_text: ctaConfig.cta_text || '',
        }}
        initialLogo={store.logo_url || ''}
        initialTypography={store.typography || { pairing: 'editorial', scale: 'standard' }}
        initialGridDensity={store.grid_density || 3}
        initialAbout={normalizeAbout(aboutSection?.config)}
        initialSocial={store.social_links || {}}
        sectionsMeta={sectionsMeta}
      />
    </div>
  )
}