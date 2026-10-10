// Server-only. Never import this from a client component.
// Verifies the *current session user* is a platform owner. Call this at the top of
// every server action or route handler that uses the service-role admin client,
// because server actions are public POST endpoints and layout checks don't cover them.

import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server'

export type OwnerCheck =
  | { ok: true; userId: string; merchantId: string }
  | { ok: false; error: string }

export async function requireOwner(): Promise<OwnerCheck> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, is_owner')
    .eq('user_id', user.id)
    .single()

  if (!merchant?.is_owner) return { ok: false, error: 'Not authorized' }

  return { ok: true, userId: user.id, merchantId: merchant.id }
}

/** For server components/pages: redirects instead of returning an error. */
export async function requireOwnerPage() {
  const auth = await requireOwner()
  if (!auth.ok) redirect(auth.error === 'Not authenticated' ? '/login' : '/')
  return auth
}