import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { AuthLayout } from '../../components/AuthLayout'
import { VerifyWizard } from './VerifyWizard'

export default async function VerifyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant } = await supabase
    .from('merchants')
    .select('phone, phone_verified_at, verification_status')
    .eq('user_id', user.id)
    .single()

  if (merchant?.verification_status === 'verified') {
    redirect('/stores/new')
  }

  return (
    <AuthLayout>
      <VerifyWizard initialPhone={merchant?.phone ?? null} phoneVerified={!!merchant?.phone_verified_at} />
    </AuthLayout>
  )
}