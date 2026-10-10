'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../../../lib/supabase/server'

export type DeliverySettingsInput = {
  pickupEnabled: boolean
  pickupAddress: string
  deliveryNote: string
  /** Blank = no free-delivery threshold. */
  freeDeliveryMin: string
  payOnDeliveryEnabled: boolean
  zones: { area: string; fee: string }[]
}

const MAX_ZONES = 50
const MAX_FEE = 1_000_000

export async function saveDeliverySettings(storeId: string, input: DeliverySettingsInput) {
  const pickupAddress = (input.pickupAddress ?? '').trim()
  const deliveryNote = (input.deliveryNote ?? '').trim()
  const freeRaw = (input.freeDeliveryMin ?? '').trim()

  if (pickupAddress.length > 300) return { error: 'Pickup details must be 300 characters or less.' }
  if (deliveryNote.length > 300) return { error: 'The checkout note must be 300 characters or less.' }

  let freeDeliveryMin: number | null = null
  if (freeRaw) {
    freeDeliveryMin = Number(freeRaw)
    if (!Number.isFinite(freeDeliveryMin) || freeDeliveryMin <= 0 || freeDeliveryMin > 100_000_000) {
      return { error: 'Free delivery amount must be a positive number, or left blank.' }
    }
  }

  if (!Array.isArray(input.zones) || input.zones.length > MAX_ZONES) {
    return { error: `You can add up to ${MAX_ZONES} delivery areas.` }
  }

  const zones: { area: string; fee: number }[] = []
  const seen = new Set<string>()
  for (const [i, z] of input.zones.entries()) {
    const area = (z.area ?? '').trim()
    const feeRaw = (z.fee ?? '').toString().trim()
    // Ignore completely empty rows the merchant added but didn't fill in.
    if (!area && !feeRaw) continue
    if (!area) return { error: `Delivery area ${i + 1} needs a name.` }
    if (area.length > 80) return { error: `"${area.slice(0, 20)}…" is too long (max 80 characters).` }
    const fee = Number(feeRaw === '' ? NaN : feeRaw)
    if (!Number.isFinite(fee) || fee < 0 || fee > MAX_FEE) {
      return { error: `Enter a delivery fee for "${area}" (use 0 for free).` }
    }
    const key = area.toLowerCase()
    if (seen.has(key)) return { error: `"${area}" is listed twice.` }
    seen.add(key)
    zones.push({ area, fee: Math.round(fee * 100) / 100 })
  }

  if (!input.pickupEnabled && zones.length === 0) {
    return { error: 'Turn on pickup or add at least one delivery area — otherwise customers can’t check out.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('save_delivery_settings', {
    p_store_id: storeId,
    p_pickup_enabled: !!input.pickupEnabled,
    p_pickup_address: pickupAddress || null,
    p_delivery_note: deliveryNote || null,
    p_free_delivery_min: freeDeliveryMin,
    p_pay_on_delivery_enabled: !!input.payOnDeliveryEnabled,
    p_zones: zones,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Each delivery area must have a different name.' }
    console.error('save_delivery_settings failed', error)
    return { error: 'Could not save delivery settings. Try again.' }
  }

  revalidatePath(`/stores/${storeId}/delivery`)
  revalidatePath(`/stores/${storeId}`)
}
