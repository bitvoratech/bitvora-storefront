'use server'


import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'

// Top-level storefront paths a store slug must never shadow.
const RESERVED_SLUGS = new Set([
  'api', 'admin', 'app', 'www', 'static', 'assets', 'images', 'login', 'signup',
  'cart', 'checkout', 'order', 'orders', 'product', 'products', 'favicon.ico',
  'robots.txt', 'sitemap.xml', 'bitvora', 'support', 'help',
])

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function createStore(prevState: { error?: string } | undefined, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('id, verification_status, is_suspended, is_owner, is_admin')
    .eq('user_id', user.id)
    .single()

  if (merchantError || !merchant) {
    return { error: 'Could not find your merchant profile. Try logging in again.' }
  }

  // Server actions are public POST endpoints — the page hiding the form for
  // unverified merchants is not enough on its own. (RLS enforces this too.)
  if (merchant.is_owner || merchant.is_admin) {
    return { error: 'Owner and admin accounts can’t create stores.' }
  }
  if (merchant.is_suspended) {
    return { error: 'Your account is suspended.' }
  }
  if (merchant.verification_status !== 'verified') {
    return { error: 'Verify your account before creating a store.' }
  }

  const name = ((formData.get('name') as string) || '').trim()
  const industry = ((formData.get('industry') as string) || '').trim() || null
  const bankName = ((formData.get('bank_name') as string) || '').trim()
  const accountNumber = ((formData.get('account_number') as string) || '').replace(/\s/g, '')
  const accountName = ((formData.get('account_name') as string) || '').trim()

  if (name.length < 2 || name.length > 80) {
    return { error: 'Store name must be between 2 and 80 characters.' }
  }

  if (!bankName || !accountNumber || !accountName) {
    return { error: 'Bank account details are required to create a store.' }
  }

  if (!/^\d{10}$/.test(accountNumber)) {
    return { error: 'Account number must be 10 digits.' }
  }

  if (bankName.length > 100 || accountName.length > 100) {
    return { error: 'Bank details are too long.' }
  }

  let baseSlug = slugify(name).replace(/^-+|-+$/g, '').slice(0, 60) || 'store'
  if (RESERVED_SLUGS.has(baseSlug)) baseSlug = `${baseSlug}-store`
  let slug = baseSlug
  let attempt = 0

  // Handle slug collisions by appending a number
  while (attempt < 5) {
    const { data: existing } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!existing) break
    attempt++
    slug = attempt < 5
      ? `${baseSlug}-${attempt}`
      : `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`
  }

    const { data: store, error: storeError } = await supabase
    .from('stores')
    .insert({
      merchant_id: merchant.id,
      name,
      slug,
      industry,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
    })
    .select()
    .single()

  if (storeError) {
    if (storeError.code === '23505') {
      return { error: 'That store name is taken. Try a slightly different name.' }
    }
    return { error: 'Could not create your store. Try again.' }
  }

redirect(`/stores/${store.id}/setup`)
}