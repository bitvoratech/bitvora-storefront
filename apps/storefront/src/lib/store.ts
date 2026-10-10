import { cache } from 'react'
import { createClient } from './supabase/server'
import { createAdminClient } from './supabase/admin'

export type SocialLinks = { whatsapp?: string; instagram?: string; facebook?: string; tiktok?: string }

export type PublicStore = {
  id: string
  name: string
  slug: string
  industry: string | null
  logo_url: string | null
  palette: { primary?: string } | null
  typography: { pairing?: string; scale?: string } | null
  grid_density: number | null
  social_links: SocialLinks | null
  pickup_address: string | null
  /** Seller passed Bitvora's NIN/CAC identity check. */
  is_verified: boolean
}

/**
 * One published store by slug. Wrapped in React's cache() so the layout,
 * the page and generateMetadata share a single query per request.
 */
export const getPublishedStore = cache(async (slug: string): Promise<PublicStore | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('stores')
    .select('id, merchant_id, name, slug, industry, logo_url, palette, typography, grid_density, social_links, pickup_address')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  if (!data) return null

  const { merchant_id, ...store } = data as Omit<PublicStore, 'is_verified'> & { merchant_id: string }
  return { ...store, is_verified: await isMerchantVerified(merchant_id) }
})

// Customers can't read the merchants table (RLS), so this single boolean is
// looked up with the service role. Never expose anything else from that row.
async function isMerchantVerified(merchantId: string): Promise<boolean> {
  try {
    const { data } = await createAdminClient()
      .from('merchants')
      .select('verification_status')
      .eq('id', merchantId)
      .maybeSingle()
    return data?.verification_status === 'verified'
  } catch {
    return false
  }
}

/** wa.me link for the store's WhatsApp number, or null if none is set. */
export function whatsappLink(social: SocialLinks | null | undefined, message?: string): string | null {
  const raw = social?.whatsapp?.replace(/\D/g, '')
  if (!raw) return null
  // Accept local Nigerian numbers (080…) as well as international ones.
  const number = raw.startsWith('0') ? `234${raw.slice(1)}` : raw
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}

export function formatNaira(amount: number | string) {
  return `₦${Number(amount).toLocaleString()}`
}
