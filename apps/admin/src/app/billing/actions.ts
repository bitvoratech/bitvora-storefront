'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { discountedPrice, firstPaymentDiscount, hasActivePlan, parseInterval, parsePlan, planDiscountPercent } from '../../lib/plans'
import { initializeSubscription, subscriptionManageLink, upsertCustomer } from '../../lib/paystack'
import { canOpenStore } from '../../lib/merchant-identity'
import { canPayByTransfer, cardPaymentsEnabled, isFirstPayment, transferAccount, transferReference } from '../../lib/bank-transfer'
import { getClientIp, rateLimit } from '@bitvora/lib/rate-limit'

export type BillingState = { error?: string } | undefined

export type TransferState = { error?: string; sent?: boolean } | undefined

async function currentMerchant() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, full_name, phone, is_owner, is_admin, is_suspended, verification_status, phone_verified_at, subscription_status, current_period_end, paystack_customer_code, paystack_subscription_code')
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
  if (!cardPaymentsEnabled()) return { error: 'Card payments aren’t available right now. Pay by bank transfer instead.' }
  // Paying waits for the NIN/CAC review, so nobody pays and then gets rejected.
  if (!canOpenStore(merchant)) return { error: 'Verify your phone number before paying for your plan.' }
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
      discountPercent: firstPaymentDiscount(interval, planDiscountPercent()),
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

// The merchant says they've sent a bank transfer for a plan. Nothing changes on
// their plan until staff find the money and confirm it in the owner console.
export async function submitTransfer(prevState: TransferState, formData: FormData): Promise<TransferState> {
  const { merchant } = await currentMerchant()
  if (!merchant) return { error: 'Could not find your account. Try logging in again.' }
  if (merchant.is_owner || merchant.is_admin) return { error: 'Staff accounts don’t have a plan.' }
  if (merchant.is_suspended) return { error: 'Your account is suspended.' }
  if (!transferAccount()) return { error: 'Bank transfer isn’t available right now.' }
  if (!canOpenStore(merchant)) return { error: 'Verify your phone number before paying for your plan.' }
  if (!canPayByTransfer(merchant)) return { error: 'Your plan is already paid for this period.' }

  const plan = parsePlan(formData.get('plan'))
  const interval = parseInterval(formData.get('interval'))
  if (!plan || !interval) return { error: 'Pick a plan and billing period.' }
  const senderName = String(formData.get('sender_name') ?? '').trim().slice(0, 120)
  if (!senderName) return { error: 'Enter the name on the account you paid from, so we can find your transfer.' }

  const rl = await rateLimit('billing-transfer', await getClientIp(), 5, '10 m')
  if (!rl.ok) return { error: 'Too many attempts. Try again in a few minutes.' }

  const discount = isFirstPayment(merchant) ? firstPaymentDiscount(interval, planDiscountPercent()) : 0
  const admin = createAdminClient()
  const { error } = await admin.from('plan_transfers').insert({
    merchant_id: merchant.id,
    plan,
    plan_interval: interval,
    amount: discountedPrice(plan, interval, discount),
    reference: transferReference(merchant.id),
    sender_name: senderName,
  })
  if (error) {
    // The unique index allows one pending transfer per merchant.
    if (error.code === '23505') return { error: 'We’re already checking a transfer from you. We’ll update you once it’s confirmed.' }
    console.error('billing: saving transfer failed', error)
    return { error: 'We couldn’t save that. Try again in a moment.' }
  }
  // Keep the choice on record, as card checkout does.
  if (!hasActivePlan(merchant)) await admin.from('merchants').update({ plan, plan_interval: interval }).eq('id', merchant.id)

  revalidatePath('/billing')
  return { sent: true }
}
