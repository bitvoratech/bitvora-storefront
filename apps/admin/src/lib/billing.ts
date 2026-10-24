// Records Paystack plan payments and subscription changes on the merchant.
// Shared by the payment callback and the webhook, which can both see the same
// payment; every write here is safe to repeat.

import { createAdminClient } from './supabase/admin'
import { discountedPrice, parseInterval, parsePlan, planDiscountPercent, type SubscriptionStatus } from './plans'
import { periodEnd, readMetadata, type PaystackTransaction } from './paystack'

type MerchantBilling = {
  id: string
  plan: string | null
  plan_interval: string | null
  current_period_end: string | null
  last_payment_reference: string | null
}

const BILLING_COLUMNS = 'id, plan, plan_interval, current_period_end, last_payment_reference'

/**
 * Marks a successful plan payment: the first one (carrying our metadata) or a
 * renewal Paystack charged to the saved card (matched by customer code).
 * Returns the merchant id it was recorded against, or null if it isn't ours.
 */
export async function recordPayment(tx: PaystackTransaction, opts: { expectMerchantId?: string } = {}) {
  if (tx.status !== 'success' || tx.currency !== 'NGN') return null
  const meta = readMetadata(tx.metadata)
  const admin = createAdminClient()

  let merchant: MerchantBilling | null = null
  if (meta.merchant_id) {
    const { data } = await admin.from('merchants').select(BILLING_COLUMNS).eq('id', meta.merchant_id).maybeSingle()
    merchant = data
  } else if (tx.customer?.customer_code) {
    const { data } = await admin
      .from('merchants')
      .select(BILLING_COLUMNS)
      .eq('paystack_customer_code', tx.customer.customer_code)
      .maybeSingle()
    merchant = data
  }
  if (!merchant) return null
  if (opts.expectMerchantId && merchant.id !== opts.expectMerchantId) return null
  if (merchant.last_payment_reference === tx.reference) return merchant.id

  const plan = parsePlan(meta.plan) ?? parsePlan(merchant.plan)
  const interval = parseInterval(meta.interval) ?? parseInterval(merchant.plan_interval) ?? 'monthly'
  if (!plan) return null
  // A first payment must cover the plan it claims, less any discount on offer;
  // renewals are priced by Paystack's plan.
  if (meta.plan && tx.amount < discountedPrice(plan, interval, planDiscountPercent()) * 100) return null

  const paidAt = tx.paid_at ? new Date(tx.paid_at) : new Date()
  const end = periodEnd(paidAt, interval)
  const current = merchant.current_period_end ? new Date(merchant.current_period_end) : null

  const { error } = await admin
    .from('merchants')
    .update({
      plan,
      plan_interval: interval,
      subscription_status: 'active' satisfies SubscriptionStatus,
      // Deliveries can arrive out of order; never shorten a paid period.
      current_period_end: (current && current > end ? current : end).toISOString(),
      paystack_customer_code: tx.customer?.customer_code ?? undefined,
      last_payment_reference: tx.reference,
    })
    .eq('id', merchant.id)
  if (error) throw new Error(`billing: recording payment ${tx.reference} failed: ${error.message}`)
  return merchant.id
}

type SubscriptionEvent = {
  subscription_code?: string
  email_token?: string
  next_payment_date?: string | null
  customer?: { customer_code?: string }
  subscription?: { subscription_code?: string; next_payment_date?: string | null }
}

/** Applies a Paystack webhook event. Returns false when it can't be matched yet. */
export async function applyWebhookEvent(event: string, data: unknown): Promise<boolean> {
  const admin = createAdminClient()

  if (event === 'charge.success') {
    await recordPayment(data as PaystackTransaction)
    return true
  }

  const sub = data as SubscriptionEvent

  if (event === 'subscription.create') {
    const customerCode = sub.customer?.customer_code
    if (!customerCode || !sub.subscription_code) return true
    const update: Record<string, string> = {
      paystack_subscription_code: sub.subscription_code,
      subscription_status: 'active',
    }
    if (sub.email_token) update.paystack_email_token = sub.email_token
    if (sub.next_payment_date) update.current_period_end = new Date(sub.next_payment_date).toISOString()
    const { data: rows, error } = await admin
      .from('merchants')
      .update(update)
      .eq('paystack_customer_code', customerCode)
      .select('id')
    if (error) throw new Error(`billing: subscription.create failed: ${error.message}`)
    // Not linked yet (charge.success still on its way): ask Paystack to retry.
    return (rows?.length ?? 0) > 0
  }

  const statusFor: Record<string, SubscriptionStatus> = {
    'subscription.not_renew': 'non_renewing',
    'subscription.disable': 'cancelled',
    'invoice.payment_failed': 'past_due',
  }
  const status = statusFor[event]
  if (status) {
    const code = sub.subscription_code ?? sub.subscription?.subscription_code
    if (!code) return true
    // Matching on the code means an old subscription's events can't touch a newer one.
    const { error } = await admin
      .from('merchants')
      .update({ subscription_status: status })
      .eq('paystack_subscription_code', code)
      .neq('subscription_status', 'comped')
    if (error) throw new Error(`billing: ${event} failed: ${error.message}`)
  }
  return true
}
