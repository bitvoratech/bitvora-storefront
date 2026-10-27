import type { createClient } from './supabase/server'

/** The plan of the merchant who owns a store, or null if it can't be read. */
export async function storePlan(supabase: Awaited<ReturnType<typeof createClient>>, storeId: string): Promise<string | null> {
  const { data } = await supabase.from('stores').select('merchants(plan)').eq('id', storeId).maybeSingle()
  const merchant = data?.merchants as { plan?: string | null } | { plan?: string | null }[] | null | undefined
  return (Array.isArray(merchant) ? merchant[0]?.plan : merchant?.plan) ?? null
}
