'use server'


import { revalidatePath } from 'next/cache'
import { createClient } from '../../../lib/supabase/server'

export async function toggleStorePublish(storeId: string, currentState: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('stores')
    .update({ is_published: !currentState })
    .eq('id', storeId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/stores/${storeId}`)
  revalidatePath('/')
}

export async function updateStorePalette(storeId: string, formData: FormData) {
  const supabase = await createClient()
  const primary = formData.get('primary') as string
  if (!/^#[0-9a-fA-F]{6}$/.test(primary ?? '')) return { error: 'Pick a valid colour.' }

  const { error } = await supabase
    .from('stores')
    .update({ palette: { primary } })
    .eq('id', storeId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/stores/${storeId}`)
}

export async function upsertHeroSection(storeId: string, formData: FormData) {
  const supabase = await createClient()

  const heading = formData.get('heading') as string
  const subheading = formData.get('subheading') as string
  const imageUrl = formData.get('image_url') as string
  const ctaText = formData.get('cta_text') as string

  const { data: existing } = await supabase
    .from('sections')
    .select('id')
    .eq('store_id', storeId)
    .eq('type', 'hero')
    .maybeSingle()

  const config = {
    heading,
    subheading,
    image_url: imageUrl || null,
    cta_text: ctaText || 'Shop now',
  }

  if (existing) {
    const { error } = await supabase
      .from('sections')
      .update({ config })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('sections')
      .insert({ store_id: storeId, type: 'hero', position: 0, config, is_visible: true })
    if (error) return { error: error.message }
  }

  revalidatePath(`/stores/${storeId}`)
}

export async function upsertCtaBannerSection(storeId: string, formData: FormData) {
  const supabase = await createClient()

  const heading = formData.get('heading') as string
  const imageUrl = formData.get('image_url') as string
  const ctaText = formData.get('cta_text') as string

  const { data: existing } = await supabase
    .from('sections')
    .select('id')
    .eq('store_id', storeId)
    .eq('type', 'cta_banner')
    .maybeSingle()

  const config = {
    heading,
    image_url: imageUrl || null,
    cta_text: ctaText || 'Shop now',
  }

  if (existing) {
    const { error } = await supabase.from('sections').update({ config }).eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('sections')
      .insert({ store_id: storeId, type: 'cta_banner', position: 10, config, is_visible: true })
    if (error) return { error: error.message }
  }

  revalidatePath(`/stores/${storeId}`)
}

export async function upsertBannerGridSection(storeId: string, formData: FormData) {
  const supabase = await createClient()

  const tiles = [1, 2, 3].map((n) => ({
    heading: formData.get(`tile${n}_heading`) as string,
    image_url: (formData.get(`tile${n}_image`) as string) || null,
    cta_text: (formData.get(`tile${n}_cta`) as string) || 'Shop now',
  }))

  const { data: existing } = await supabase
    .from('sections')
    .select('id')
    .eq('store_id', storeId)
    .eq('type', 'banner_grid')
    .maybeSingle()

  const config = { tiles }

  if (existing) {
    const { error } = await supabase.from('sections').update({ config }).eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('sections')
      .insert({ store_id: storeId, type: 'banner_grid', position: 1, config, is_visible: true })
    if (error) return { error: error.message }
  }

  revalidatePath(`/stores/${storeId}`)
}