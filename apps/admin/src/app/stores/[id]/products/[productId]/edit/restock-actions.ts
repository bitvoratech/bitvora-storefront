'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../../../../../lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Mark restock requests as notified. RLS limits this to the merchant's own store. */
export async function markRestockNotified(storeId: string, productId: string, requestIds: string[]) {
  if (!Array.isArray(requestIds) || requestIds.length === 0 || requestIds.length > 500) {
    return { error: 'Nothing to update.' }
  }
  if (!requestIds.every((id) => typeof id === 'string' && UUID_RE.test(id))) {
    return { error: 'Invalid request.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('restock_requests')
    .update({ notified_at: new Date().toISOString() })
    .eq('store_id', storeId)
    .eq('product_id', productId)
    .in('id', requestIds)
    .is('notified_at', null)

  if (error) return { error: 'Could not update. Try again.' }

  revalidatePath(`/stores/${storeId}/products/${productId}/edit`)
  revalidatePath(`/stores/${storeId}/products`)
  revalidatePath(`/stores/${storeId}`)
}
