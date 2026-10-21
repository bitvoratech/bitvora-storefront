// Server-only. Never import this from a client component.
// Verifies the *current session user* is platform staff. Call one of these at
// the top of every server action or route handler that uses the service-role
// admin client, because server actions are public POST endpoints and layout
// checks don't cover them.
//
// Roles: the owner runs the platform and is the only one who can add or remove
// admins. Admins can use the rest of the owner console.

import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server'

export type StaffRole = 'owner' | 'admin'

export type StaffCheck =
  | { ok: true; userId: string; merchantId: string; role: StaffRole }
  | { ok: false; error: string }

export function staffRole(merchant: { is_owner?: boolean | null; is_admin?: boolean | null } | null | undefined): StaffRole | null {
  if (merchant?.is_owner) return 'owner'
  if (merchant?.is_admin) return 'admin'
  return null
}

/** Owner or admin. */
export async function requireStaff(): Promise<StaffCheck> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, is_owner, is_admin, is_suspended')
    .eq('user_id', user.id)
    .single()

  const role = staffRole(merchant)
  if (!merchant || !role || merchant.is_suspended) return { ok: false, error: 'Not authorized' }

  return { ok: true, userId: user.id, merchantId: merchant.id, role }
}

/** The owner only (e.g. adding or removing admins). */
export async function requireOwner(): Promise<StaffCheck> {
  const auth = await requireStaff()
  if (auth.ok && auth.role !== 'owner') return { ok: false, error: 'Only the owner can do this' }
  return auth
}

/** For server components/pages: redirects instead of returning an error. */
export async function requireStaffPage() {
  const auth = await requireStaff()
  if (!auth.ok) redirect(auth.error === 'Not authenticated' ? '/login' : '/')
  return auth
}

export async function requireOwnerPage() {
  const auth = await requireOwner()
  if (!auth.ok) redirect(auth.error === 'Not authenticated' ? '/login' : '/owner')
  return auth
}
