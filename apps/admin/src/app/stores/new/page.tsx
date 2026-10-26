import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { StoreForm } from './StoreForm'
import { Card } from '@bitvora/ui/src/Card'
import { hasActivePlan } from '../../../lib/plans'
import { canOpenStore } from '../../../lib/merchant-identity'

export default async function NewStorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant } = await supabase
    .from('merchants')
    .select('verification_status, phone_verified_at, is_owner, is_admin, subscription_status, current_period_end')
    .eq('user_id', user.id)
    .single()

  // Owner and admin accounts run the platform, not stores.
  if (merchant?.is_owner || merchant?.is_admin) redirect('/owner')

  // A store needs a verified phone (OTP on /verify). NIN/CAC is optional.
  if (!canOpenStore(merchant)) redirect('/verify')
  // Then the plan picked at signup has to be paid for.
  if (!hasActivePlan(merchant)) redirect('/billing')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-display font-semibold mb-1">Create your store</h1>
      <Card>
        <StoreForm />
      </Card>
    </div>
  )
}