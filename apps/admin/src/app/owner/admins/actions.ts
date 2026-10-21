'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../lib/supabase/admin'
import { requireOwner } from '../../../lib/auth/require-owner'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type AddAdminResult =
  | { error: string }
  | { ok: true; email: string; tempPassword: string | null }

type AdminClient = ReturnType<typeof createAdminClient>

async function findUserIdByEmail(admin: AdminClient, email: string) {
  // supabase-js has no lookup-by-email, so page through the users list.
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return null
    const match = data.users.find((u) => u.email?.toLowerCase() === email)
    if (match) return match.id
    if (data.users.length < 1000) return null
  }
  return null
}

// Only the owner can add admins. An existing account is promoted; otherwise a
// new account is created with a one-time password the owner passes on.
export async function addAdmin(_prev: AddAdminResult | undefined, formData: FormData): Promise<AddAdminResult> {
  const auth = await requireOwner()
  if (!auth.ok) return { error: auth.error }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const fullName = String(formData.get('full_name') ?? '').trim().slice(0, 100)
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: 'Enter a valid email address.' }

  const admin = createAdminClient()

  let userId: string | null = null
  let tempPassword: string | null = null

  const password = randomBytes(12).toString('base64url')
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (created?.user) {
    userId = created.user.id
    tempPassword = password
  } else if (createError?.code === 'email_exists' || createError?.status === 422) {
    userId = await findUserIdByEmail(admin, email)
  }
  if (!userId) return { error: createError?.message ?? 'Could not add that account. Try again.' }

  // The on_auth_user_created trigger makes the merchants row.
  const { data: merchant } = await admin
    .from('merchants')
    .select('id, full_name, is_owner, is_admin')
    .eq('user_id', userId)
    .single()
  if (!merchant) return { error: 'That account has no profile yet. Try again in a moment.' }
  if (merchant.is_owner) return { error: 'That’s the owner account.' }
  if (merchant.is_admin) return { error: 'That account is already an admin.' }

  // Admins don't run stores, so a selling merchant can't be turned into one.
  const { count } = await admin.from('stores').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant.id)
  if (count) return { error: 'That account runs a store. Use a separate email for the admin.' }

  const { error } = await admin
    .from('merchants')
    .update({ is_admin: true, ...(fullName && !merchant.full_name ? { full_name: fullName } : {}) })
    .eq('id', merchant.id)
  if (error) return { error: error.message }

  revalidatePath('/owner/admins')
  revalidatePath('/owner')
  return { ok: true, email, tempPassword }
}

export async function removeAdmin(merchantId: string) {
  const auth = await requireOwner()
  if (!auth.ok) return { error: auth.error }
  if (typeof merchantId !== 'string') return { error: 'Invalid request' }

  const admin = createAdminClient()
  const { data: updated, error } = await admin
    .from('merchants')
    .update({ is_admin: false })
    .eq('id', merchantId)
    .eq('is_admin', true)
    .select('id')
  if (error) return { error: error.message }
  if (!updated?.length) return { error: 'That account isn’t an admin.' }

  revalidatePath('/owner/admins')
  revalidatePath('/owner')
}
