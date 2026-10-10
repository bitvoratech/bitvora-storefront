import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { StoreForm } from './StoreForm'
import { VerifyWizard } from '../../verify/VerifyWizard'
import { Card } from '@bitvora/ui/src/Card'

export default async function NewStorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant } = await supabase
    .from('merchants')
    .select('phone, phone_verified_at, verification_status')
    .eq('user_id', user.id)
    .single()

  const isVerified = merchant?.verification_status === 'verified'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-display font-semibold mb-1">
        {isVerified ? 'Create your store' : 'Verify your account'}
      </h1>
      {!isVerified && (
        <p className="text-sm text-ink/50 mb-6">
          Quick phone and identity check before you can create a store — required since your
          store will be handling customer payments.
        </p>
      )}
      <Card>
        {isVerified ? <StoreForm /> : <VerifyWizard initialPhone={merchant?.phone ?? null} phoneVerified={!!merchant?.phone_verified_at} />}
      </Card>
    </div>
  )
}