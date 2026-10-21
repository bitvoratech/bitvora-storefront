import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { StoreForm } from './StoreForm'
import { Card } from '@bitvora/ui/src/Card'

export default async function NewStorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant } = await supabase
    .from('merchants')
    .select('verification_status')
    .eq('user_id', user.id)
    .single()

  // Phone OTP and the owner's manual NIN/CAC review both live on /verify.
  if (merchant?.verification_status !== 'verified') redirect('/verify')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-display font-semibold mb-1">Create your store</h1>
      <Card>
        <StoreForm />
      </Card>
    </div>
  )
}