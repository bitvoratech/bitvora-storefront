'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { hasActivePlan, parseInterval, parsePlan } from '../../lib/plans'
import { initializeSubscription, subscriptionManageLink, upsertCustomer } from '../../lib/paystack'
import { getClientIp, rateLimit } from '@bitvora/lib/rate-limit'

export type BillingState = { error?: string } | undefined

async function currentMerchant() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, full_name, phone, is_owner, is_admin, is_suspended, verification_status, subscription_status, current_period_end, paystack_customer_code, paystack_subscription_code')
    .eq('user_id', user.id)
    .single()
  return { user, merchant }
}

// Sends the merchant to Paystack to pay for (and subscribe to) a plan.
export async function startCheckout(prevState: BillingState, formData: FormData): Promise<BillingState> {
  const { user, merchant } = await currentMerchant()
  if (!merchant || !user.email) return { error: 'Could not find your account. Try logging in again.' }
  if (merchant.is_owner || merchant.is_admin) return { error: 'Staff accounts don’t have a plan.' }
  if (merchant.is_suspended) return { error: 'Your account is suspended.' }
  // Paying waits for the NIN/CAC review, so nobody pays and then gets rejected.
  if (merchant.verification_status !== 'verified') return { error: 'You can pay once your NIN and CAC are approved.' }
  if (hasActivePlan(merchant)) return { error: 'Your plan is already active.' }

  const plan = parsePlan(formData.get('plan'))
  const interval = parseInterval(formData.get('interval'))
  if (!plan || !interval) return { error: 'Pick a plan and billing period.' }

  const rl = await rateLimit('billing', await getClientIp(), 10, '10 m')
  if (!rl.ok) return { error: 'Too many attempts. Try again in a few minutes.' }

  const origin = (await headers()).get('origin') ?? process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://app.bitvoratech.com'
  let authorizationUrl: string
  try {
    const admin = createAdminClient()
    if (!merchant.paystack_customer_code) {
      const customerCode = await upsertCustomer({
        email: user.email,
        merchantId: merchant.id,
        fullName: merchant.full_name,
        phone: merchant.phone,
      })
      // Linked up front so renewals and subscription events can find this merchant.
      await admin.from('merchants').update({ paystack_customer_code: customerCode }).eq('id', merchant.id)
    }
    // Keep the choice on record even if they don't finish paying.
    await admin.from('merchants').update({ plan, plan_interval: interval }).eq('id', merchant.id)

    const tx = await initializeSubscription({
      email: user.email,
      merchantId: merchant.id,
      plan,
      interval,
      callbackUrl: `${origin}/billing/callback`,
    })
    authorizationUrl = tx.authorization_url
  } catch (error) {
    console.error('billing: starting checkout failed', error)
    return { error: 'We couldn’t reach Paystack. Try again in a moment.' }
  }

  redirect(authorizationUrl)
}

// Paystack's hosted page for updating the card or cancelling the plan.
export async function openManageLink(): Promise<BillingState> {
  const { merchant } = await currentMerchant()
  if (!merchant?.paystack_subscription_code) return { error: 'No active subscription to manage.' }
  let link: string
  try {
    link = await subscriptionManageLink(merchant.paystack_subscription_code)
  } catch (error) {
    console.error('billing: manage link failed', error)
    return { error: 'We couldn’t reach Paystack. Try again in a moment.' }
  }
  redirect(link)
}
