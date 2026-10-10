'use server'


import { revalidatePath } from 'next/cache'
import { createClient } from '../../../../lib/supabase/server'

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

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
  tiles: { heading: string; image_url: string; cta_text: string }[]
) {
  const supabase = await createClient()
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
  const { error } = await supabase.from('stores').update({ grid_density: density }).eq('id', storeId)
  if (error) return { error: error.message }
  revalidatePath(`/stores/${storeId}`)
}

export async function saveAboutSection(storeId: string, heading: string, body: string) {
  const supabase = await createClient()
  const { data: existing } = await supabase.from('sections').select('id').eq('store_id', storeId).eq('type', 'about').maybeSingle()
  const config = { heading, body }
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
  const { error } = await supabase.from('sections').update({ is_visible: visible }).eq('store_id', storeId).eq('type', sectionType)
  if (error) return { error: error.message }
  revalidatePath(`/stores/${storeId}`)
}

export async function reorderSection(storeId: string, sectionType: string, direction: 'up' | 'down') {
  const supabase = await createClient()
  const { data: sections } = await supabase.from('sections').select('id, type, position').eq('store_id', storeId).order('position')
  if (!sections) return

  const idx = sections.findIndex((s) => s.type === sectionType)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (idx === -1 || swapIdx < 0 || swapIdx >= sections.length) return

  const a = sections[idx]
  const b = sections[swapIdx]
  await supabase.from('sections').update({ position: b.position }).eq('id', a.id)
  await supabase.from('sections').update({ position: a.position }).eq('id', b.id)
  revalidatePath(`/stores/${storeId}`)
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
}