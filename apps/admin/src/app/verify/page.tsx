import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { AuthLayout } from '../../components/AuthLayout'
import { VerifyWizard } from './VerifyWizard'

export default async function VerifyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, phone, phone_verified_at, verification_status')
    .eq('user_id', user.id)
    .single()

  if (merchant?.verification_status === 'verified') {
    redirect('/stores/new')
  }

  // OTP rows are server-only, so check for a live code with the service role.
  let hasPendingCode = false
  if (merchant && !merchant.phone_verified_at) {
    const { data: otp } = await createAdminClient()
      .from('merchant_otps')
      .select('id')
      .eq('merchant_id', merchant.id)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle()
    hasPendingCode = !!otp
  }

  return (
    <AuthLayout>
      <VerifyWizard
        initialPhone={merchant?.phone ?? null}
        phoneVerified={!!merchant?.phone_verified_at}
        hasPendingCode={hasPendingCode}
      />
    </AuthLayout>
  )
}