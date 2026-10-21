'use server'


import { revalidatePath } from 'next/cache'
import { createClient } from '../../../../lib/supabase/server'

const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const

export async function updateOrderStatus(orderId: string, storeId: string, status: string) {
  if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return { error: 'Invalid status' }
  }

  const supabase = await createClient()
  // RLS silently filters out orders this merchant can't update (other stores,
  // suspended account), so check a row actually changed instead of assuming it.
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .eq('store_id', storeId)
    .select('id')

  if (error) {
    console.error('updateOrderStatus failed', error)
    return { error: 'Could not update the order status. Try again.' }
  }
  if (!data?.length) {
    return { error: 'This order could not be updated.' }
  }

  revalidatePath(`/stores/${storeId}/orders`)
  revalidatePath(`/stores/${storeId}/orders/${orderId}`)
}