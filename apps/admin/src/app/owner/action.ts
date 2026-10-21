'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { sendSms } from '../../lib/termii'
import { createAdminClient } from '../../lib/supabase/admin'
import { requireStaff } from '../../lib/auth/require-owner'

export async function toggleMerchantSuspension(merchantId: string, suspend: boolean) {
  const auth = await requireStaff()
  if (!auth.ok) return { error: auth.error }

  if (typeof merchantId !== 'string' || typeof suspend !== 'boolean') {
    return { error: 'Invalid request' }
  }

  // Don't let an owner lock themselves out of the platform console.
  if (suspend && merchantId === auth.merchantId) {
    return { error: 'You cannot suspend your own account' }
  }

  // Staff accounts aren't merchants: the owner removes an admin from the
  // Admins tab instead, and an admin must never be able to lock out the owner.
  const admin = createAdminClient()
  const { data: updated, error } = await admin
    .from('merchants')
    .update({ is_suspended: suspend })
    .eq('id', merchantId)
    .eq('is_owner', false)
    .eq('is_admin', false)
    .select('id')
  if (error) return { error: error.message }
  if (!updated?.length) return { error: 'Owner and admin accounts can’t be suspended here.' }

  revalidatePath('/owner/merchants')
  revalidatePath(`/owner/merchants/${merchantId}`)
}

export async function unpublishStore(storeId: string) {
  const auth = await requireStaff()
  if (!auth.ok) return { error: auth.error }

  if (typeof storeId !== 'string') return { error: 'Invalid request' }

  const admin = createAdminClient()
  const { error } = await admin.from('stores').update({ is_published: false }).eq('id', storeId)
  if (error) return { error: error.message }

  revalidatePath('/owner/stores')
}
// Manual NIN/CAC review. Both numbers are checked by the owner outside the
// app (NIMC / CAC portals); this records the decision.
export async function reviewMerchantVerification(merchantId: string, decision: 'approve' | 'reject', note?: string) {
  const auth = await requireStaff()
  if (!auth.ok) return { error: auth.error }

  if (typeof merchantId !== 'string' || (decision !== 'approve' && decision !== 'reject')) {
    return { error: 'Invalid request' }
  }
  const reason = (note ?? '').trim().slice(0, 500)
  if (decision === 'reject' && !reason) {
    return { error: 'Say why, so the merchant knows what to fix.' }
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  const approved = decision === 'approve'

  // Only merchants who've verified their phone and submitted details can be
  // reviewed; the status filter also stops two owners double-handling one.
  const { data: updated, error } = await admin
    .from('merchants')
    .update({
      verification_status: approved ? 'verified' : 'failed',
      verified_at: approved ? now : null,
      verification_reviewed_at: now,
      verification_reviewed_by: auth.merchantId,
      verification_note: approved ? null : reason,
    })
    .eq('id', merchantId)
    .in('verification_status', ['pending', 'failed'])
    .not('phone_verified_at', 'is', null)
    .not('nin', 'is', null)
    .not('cac_number', 'is', null)
    .select('id, nin, cac_number, phone')
  if (error) return { error: error.message }
  if (!updated?.length) return { error: 'This merchant has nothing to review right now.' }

  const { nin, cac_number, phone } = updated[0]
  const { error: logError } = await admin.from('merchant_verifications').insert([
    { merchant_id: merchantId, type: 'nin', reference: nin, provider: 'manual', status: approved ? 'verified' : 'failed', provider_response: { reviewed_by: auth.merchantId, note: reason || null } },
    { merchant_id: merchantId, type: 'cac', reference: cac_number, provider: 'manual', status: approved ? 'verified' : 'failed', provider_response: { reviewed_by: auth.merchantId, note: reason || null } },
  ])
  if (logError) console.error('verification audit log insert failed', logError)

  // Tell the merchant so they don't have to keep checking. Best-effort: the
  // decision is saved either way, and they see it next time they log in.
  if (phone) {
    const origin = (await headers()).get('origin') ?? ''
    const message = approved
      ? `Bitvora: Your business details are approved. You can now create your store${origin ? `: ${origin}/stores/new` : '.'}`
      : `Bitvora: We couldn't verify your business details: ${reason.slice(0, 200).replace(/([^.!?])$/, '$1.')} Update them${origin ? ` at ${origin}/verify` : ' when you next log in'}.`
    try {
      await sendSms(phone, message)
    } catch (e) {
      console.error('verification decision SMS failed', e)
    }
  }

  revalidatePath('/owner/verifications')
  revalidatePath('/owner/merchants')
  revalidatePath(`/owner/merchants/${merchantId}`)
}
