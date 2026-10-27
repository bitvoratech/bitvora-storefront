'use server'


import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'
import { normalizeSizes } from '../../../../lib/product-sizes'
import { productLimitMessage, underProductLimit } from '../../../../lib/plans'
import { storePlan } from '../../../../lib/store-plan'

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const MAX_IMAGES = 8

type ParsedProduct =
  | { ok: true; name: string; description: string | null; price: number; compareAtPrice: number | null; stockQuantity: number; category: string | null; images: string[]; sizes: string[] }
  | { ok: false; error: string }

// Server actions are public endpoints: never trust the form, even though the
// UI already constrains these inputs.
function parseProductForm(formData: FormData): ParsedProduct {
  const name = ((formData.get('name') as string) || '').trim()
  const description = ((formData.get('description') as string) || '').trim() || null
  const price = Number(formData.get('price'))
  const compareRaw = ((formData.get('compare_at_price') as string) || '').trim()
  const compareAtPrice = compareRaw ? Number(compareRaw) : null
  const stockRaw = Number(formData.get('stock_quantity') || 0)
  const category = ((formData.get('category') as string) || '').trim() || null

  if (name.length < 2 || name.length > 120) {
    return { ok: false, error: 'Product name must be between 2 and 120 characters.' }
  }
  if (!Number.isFinite(price) || price <= 0 || price > 100_000_000) {
    return { ok: false, error: 'Valid price is required.' }
  }
  if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice <= price)) {
    return { ok: false, error: '"Was" price must be higher than the current price, or left blank.' }
  }
  if (!Number.isInteger(stockRaw) || stockRaw < 0 || stockRaw > 1_000_000) {
    return { ok: false, error: 'Stock must be a whole number of 0 or more.' }
  }
  if (description && description.length > 5000) {
    return { ok: false, error: 'Description is too long.' }
  }

  let images: unknown = []
  const imagesRaw = formData.get('images') as string | null
  if (imagesRaw) {
    try {
      images = JSON.parse(imagesRaw)
    } catch {
      return { ok: false, error: 'Invalid images.' }
    }
  }
  if (
    !Array.isArray(images) ||
    images.length > MAX_IMAGES ||
    !images.every((u) => typeof u === 'string' && u.startsWith('https://res.cloudinary.com/'))
  ) {
    return { ok: false, error: 'Invalid images.' }
  }

  let sizesRaw: unknown = []
  try {
    sizesRaw = JSON.parse((formData.get('sizes') as string | null) || '[]')
  } catch {
    return { ok: false, error: 'Invalid sizes.' }
  }
  const sizes = normalizeSizes(sizesRaw)
  if (!sizes.ok) return { ok: false, error: sizes.error }

  return {
    ok: true,
    name,
    description,
    price: Math.round(price * 100) / 100,
    compareAtPrice: compareAtPrice === null ? null : Math.round(compareAtPrice * 100) / 100,
    stockQuantity: stockRaw,
    category,
    images,
    sizes: sizes.sizes,
  }
}

export async function createProduct(storeId: string, prevState: { error?: string } | undefined, formData: FormData) {
  const supabase = await createClient()

  const parsed = parseProductForm(formData)
  if (!parsed.ok) return { error: parsed.error }
  const { name, description, price, compareAtPrice, stockQuantity, category, images, sizes } = parsed

  const baseSlug = slugify(name).replace(/^-+|-+$/g, '').slice(0, 80) || 'product'
  let slug = baseSlug
  let attempt = 0

  while (attempt < 5) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId)
      .eq('slug', slug)
      .maybeSingle()

    if (!existing) break
    attempt++
    slug = attempt < 5
      ? `${baseSlug}-${attempt}`
      : `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`
  }

  // The database enforces this too; checking first gives a clearer message.
  const plan = await storePlan(supabase, storeId)
  const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeId)
  if (!underProductLimit(plan, count ?? 0)) return { error: `${productLimitMessage(plan)} Upgrade under Plan & billing.` }

  const { error } = await supabase.from('products').insert({
    store_id: storeId,
    name,
    slug,
    description,
    price,
    compare_at_price: compareAtPrice,
    stock_quantity: stockQuantity,
    category,
    images,
    sizes,
  })

  if (error) {
    if (error.message?.includes('plan_product_limit')) return { error: `${productLimitMessage(plan)} Upgrade under Plan & billing.` }
    return { error: 'Could not save the product. Try again.' }
  }

  revalidatePath(`/stores/${storeId}/products`)
  redirect(`/stores/${storeId}/products`)
}

export async function updateProduct(productId: string, storeId: string, prevState: { error?: string } | undefined, formData: FormData) {
  const supabase = await createClient()

  const parsed = parseProductForm(formData)
  if (!parsed.ok) return { error: parsed.error }
  const { name, description, price, compareAtPrice, stockQuantity, category, images, sizes } = parsed
  const isActive = formData.get('is_active') === 'on'

  const { error } = await supabase
    .from('products')
    .update({
      name,
      description,
      price,
      compare_at_price: compareAtPrice,
      stock_quantity: stockQuantity,
      category,
      is_active: isActive,
      images,
      sizes,
    })
    .eq('id', productId)
    .eq('store_id', storeId)

  if (error) {
    return { error: 'Could not save the product. Try again.' }
  }

  revalidatePath(`/stores/${storeId}/products`)
  redirect(`/stores/${storeId}/products`)
}

export async function deleteProduct(productId: string, storeId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', productId).eq('store_id', storeId)
  // Used directly as a <form action>, so it can't return an error object.
  if (error) throw new Error('Could not delete the product. Try again.')
  revalidatePath(`/stores/${storeId}/products`)
}