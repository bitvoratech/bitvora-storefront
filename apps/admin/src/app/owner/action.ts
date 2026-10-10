'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../lib/supabase/admin'
import { requireOwner } from '../../lib/auth/require-owner'

export async function toggleMerchantSuspension(merchantId: string, suspend: boolean) {
  const auth = await requireOwner()
  if (!auth.ok) return { error: auth.error }

  if (typeof merchantId !== 'string' || typeof suspend !== 'boolean') {
    return { error: 'Invalid request' }
  }

  // Don't let an owner lock themselves out of the platform console.
  if (suspend && merchantId === auth.merchantId) {
    return { error: 'You cannot suspend your own account' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('merchants').update({ is_suspended: suspend }).eq('id', merchantId)
  if (error) return { error: error.message }

  revalidatePath('/owner/merchants')
  revalidatePath(`/owner/merchants/${merchantId}`)
}

export async function unpublishStore(storeId: string) {
  const auth = await requireOwner()
  if (!auth.ok) return { error: auth.error }

  if (typeof storeId !== 'string') return { error: 'Invalid request' }

  const admin = createAdminClient()
  const { error } = await admin.from('stores').update({ is_published: false }).eq('id', storeId)
  if (error) return { error: error.message }

  revalidatePath('/owner/stores')
}