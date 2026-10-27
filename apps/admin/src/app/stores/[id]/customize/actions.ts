'use server'


import { revalidatePath } from 'next/cache'
import { createClient } from '../../../../lib/supabase/server'
import { normalizeAbout, type AboutConfig } from '@bitvora/lib/about-section'
import { hasFullCustomization } from '@bitvora/lib/plan-features'
import { storePlan } from '../../../../lib/store-plan'

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

// Growth-only settings. The database refuses these on Starter too
// (plan_features migration); checking here gives a clearer message.
async function growthOnly(supabase: Awaited<ReturnType<typeof createClient>>, storeId: string) {
  if (!hasFullCustomization(await storePlan(supabase, storeId))) {
    return { error: 'This needs the Growth plan. Upgrade under Plan & billing.' }
  }
}

export async function saveBrandColor(storeId: string, color: string) {
  if (!HEX_COLOR_RE.test(color)) return { error: 'Pick a valid colour.' }
  const supabase = await createClient()
  const { error } = await supabase.from('stores').update({ palette: { primary: color } }).eq('id', storeId)
  if (error) return { error: error.message }
  revalidatePath(`/stores/${storeId}`)
}

export async function saveHeroSection(
  storeId: string,
  config: { heading: string; subheading: string; image_url: string; cta_text: string }
) {
  const supabase = await createClient()
  const { data: existing } = await supabase.from('sections').select('id').eq('store_id', storeId).eq('type', 'hero').maybeSingle()
  if (existing) {
    const { error } = await supabase.from('sections').update({ config }).eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('sections').insert({ store_id: storeId, type: 'hero', position: 0, config, is_visible: true })
    if (error) return { error: error.message }
  }
  revalidatePath(`/stores/${storeId}`)
}

export async function saveBannerGridSection(
  storeId: string,
  tiles: { heading: string; image_url: string; cta_text: string; category?: string }[]
) {
  const supabase = await createClient()
  const locked = await growthOnly(supabase, storeId)
  if (locked) return locked
  const { data: existing } = await supabase.from('sections').select('id').eq('store_id', storeId).eq('type', 'banner_grid').maybeSingle()
  const config = { tiles }
  if (existing) {
    const { error } = await supabase.from('sections').update({ config }).eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('sections').insert({ store_id: storeId, type: 'banner_grid', position: 1, config, is_visible: true })
    if (error) return { error: error.message }
  }
  revalidatePath(`/stores/${storeId}`)
}

export async function saveCtaBannerSection(
  storeId: string,
  config: { heading: string; image_url: string; cta_text: string }
) {
  const supabase = await createClient()
  const locked = await growthOnly(supabase, storeId)
  if (locked) return locked
  const { data: existing } = await supabase.from('sections').select('id').eq('store_id', storeId).eq('type', 'cta_banner').maybeSingle()
  if (existing) {
    const { error } = await supabase.from('sections').update({ config }).eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('sections').insert({ store_id: storeId, type: 'cta_banner', position: 10, config, is_visible: true })
    if (error) return { error: error.message }
  }
  revalidatePath(`/stores/${storeId}`)
}

export async function saveTypography(storeId: string, pairing: string, scale: string) {
  const supabase = await createClient()
  const locked = await growthOnly(supabase, storeId)
  if (locked) return locked
  const { error } = await supabase.from('stores').update({ typography: { pairing, scale } }).eq('id', storeId)
  if (error) return { error: error.message }
  revalidatePath(`/stores/${storeId}`)
}

export async function saveLogo(storeId: string, logoUrl: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('stores').update({ logo_url: logoUrl }).eq('id', storeId)
  if (error) return { error: error.message }
  revalidatePath(`/stores/${storeId}`)
}

export async function saveGridDensity(storeId: string, density: number) {
  const supabase = await createClient()
  const locked = await growthOnly(supabase, storeId)
  if (locked) return locked
  const { error } = await supabase.from('stores').update({ grid_density: density }).eq('id', storeId)
  if (error) return { error: error.message }
  revalidatePath(`/stores/${storeId}`)
}

export async function saveAboutSection(storeId: string, about: AboutConfig) {
  const supabase = await createClient()
  const locked = await growthOnly(supabase, storeId)
  if (locked) return locked
  const { data: existing } = await supabase.from('sections').select('id').eq('store_id', storeId).eq('type', 'about').maybeSingle()
  // Same trimming and limits the storefront reads with.
  const config = normalizeAbout(about)
  if (existing) {
    const { error } = await supabase.from('sections').update({ config }).eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('sections').insert({ store_id: storeId, type: 'about', position: 5, config, is_visible: true })
    if (error) return { error: error.message }
  }
  revalidatePath(`/stores/${storeId}`)
}

export async function saveSocialLinks(storeId: string, links: { whatsapp?: string; instagram?: string; facebook?: string; tiktok?: string }) {
  const supabase = await createClient()
  const { error } = await supabase.from('stores').update({ social_links: links }).eq('id', storeId)
  if (error) return { error: error.message }
  revalidatePath(`/stores/${storeId}`)
}

export async function toggleSectionVisibility(storeId: string, sectionType: string, visible: boolean) {
  const supabase = await createClient()
  const locked = await growthOnly(supabase, storeId)
  if (locked) return locked
  const { error } = await supabase.from('sections').update({ is_visible: visible }).eq('store_id', storeId).eq('type', sectionType)
  if (error) return { error: error.message }
  revalidatePath(`/stores/${storeId}`)
}

export async function reorderSection(storeId: string, sectionType: string, direction: 'up' | 'down') {
  const supabase = await createClient()
  const locked = await growthOnly(supabase, storeId)
  if (locked) return locked
  const { data: sections } = await supabase.from('sections').select('id, store_id, type, position').eq('store_id', storeId).order('position')
  if (!sections) return { error: 'Could not load sections.' }

  const idx = sections.findIndex((s) => s.type === sectionType)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (idx === -1 || swapIdx < 0 || swapIdx >= sections.length) return

  const a = sections[idx]
  const b = sections[swapIdx]
  // One upsert = one statement, so the swap can't half-apply and leave two
  // sections on the same position.
  const { error } = await supabase.from('sections').upsert(
    [
      { id: a.id, store_id: a.store_id, type: a.type, position: b.position },
      { id: b.id, store_id: b.store_id, type: b.type, position: a.position },
    ],
    { onConflict: 'id' }
  )
  if (error) return { error: 'Could not reorder sections. Try again.' }
  revalidatePath(`/stores/${storeId}`)
  revalidatePath(`/stores/${storeId}/customize`)
}

export async function saveBankDetails(storeId: string, bankName: string, accountNumber: string, accountName: string) {
  // Customers transfer money to these details, so hold them to the same rules as store creation.
  bankName = (bankName ?? '').trim()
  accountName = (accountName ?? '').trim()
  accountNumber = (accountNumber ?? '').replace(/\s/g, '')
  if (!bankName || !accountName || bankName.length > 100 || accountName.length > 100) {
    return { error: 'Enter your bank name and account name.' }
  }
  if (!/^\d{10}$/.test(accountNumber)) return { error: 'Account number must be 10 digits.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('stores')
    .update({ bank_name: bankName, account_number: accountNumber, account_name: accountName })
    .eq('id', storeId)
  if (error) return { error: error.message }
  revalidatePath(`/stores/${storeId}`)
  revalidatePath(`/stores/${storeId}/delivery`)
}