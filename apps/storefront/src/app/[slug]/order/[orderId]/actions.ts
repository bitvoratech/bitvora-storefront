'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { getClientIp, rateLimit } from '../../../../lib/rate-limit'
import { isPaymentProofUrl } from '../../../../lib/cloudinary-url'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function savePaymentProof(orderId: string, slug: string, proofUrl: string) {
  const rl = await rateLimit('proof', await getClientIp(), 10, '10 m')
  if (!rl.ok) return { error: 'Too many attempts. Try again in a few minutes.' }

  if (typeof orderId !== 'string' || !UUID_RE.test(orderId)) {
    return { error: 'Order not found.' }
  }
  if (!isPaymentProofUrl(proofUrl)) {
    return { error: 'Invalid upload.' }
  }

  // Service role so this works the same whether or not the visitor happens to
  // have a session cookie; the filters below are the whole authorization rule:
  // only a still-pending order, and only the proof column.
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .update({ payment_proof_url: proofUrl })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('id')

  if (error) {
    console.error('savePaymentProof failed', error)
    return { error: 'Could not save your proof. Try again.' }
  }
  if (!data?.length) return { error: 'This order can no longer be updated.' }

  revalidatePath(`/${encodeURIComponent(slug)}/order/${orderId}`)
}
