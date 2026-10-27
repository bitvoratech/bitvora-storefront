import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { AuthLayout } from '../../components/AuthLayout'
import { VerifyWizard } from './VerifyWizard'
import type { VerificationStatus } from '../../lib/merchant-identity'
import { hasActivePlan } from '../../lib/plans'

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, phone, phone_verified_at, verification_status, nin, cac_number, business_name, verification_note, is_owner, is_admin, compliance_due_at, subscription_status, current_period_end')
    .eq('user_id', user.id)
    .single()

  // Verification is for merchants who want a store; staff don't get one.
  if (merchant?.is_owner || merchant?.is_admin) redirect('/owner')

  // Nothing left to do here once NIN/CAC are approved.
  if (merchant?.verification_status === 'verified') {
    redirect('/')
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
        status={(merchant?.verification_status ?? 'unverified') as VerificationStatus}
        nin={merchant?.nin ?? null}
        cacNumber={merchant?.cac_number ?? null}
        businessName={merchant?.business_name ?? null}
        reviewNote={merchant?.verification_note ?? null}
        planPaid={hasActivePlan(merchant)}
        justPaid={(await searchParams).payment === 'success'}
        complianceDueAt={merchant?.compliance_due_at ?? null}
      />
    </AuthLayout>
  )
}
