// Paying for a plan by bank transfer, as a stopgap while Paystack card
// payments aren't available. The merchant transfers to the account set in env,
// says they've paid on /billing, and staff confirm it in Owner console → Plan
// payments, which activates the plan for the paid period. Server-only.

import { hasActivePlan } from './plans'

export type TransferAccount = { bankName: string; accountNumber: string; accountName: string }

/** The account merchants pay into, or null (transfers off) unless all three are set. */
export function transferAccount(env: Record<string, string | undefined> = process.env): TransferAccount | null {
  const bankName = env.PLAN_TRANSFER_BANK_NAME?.trim()
  const accountNumber = env.PLAN_TRANSFER_ACCOUNT_NUMBER?.trim()
  const accountName = env.PLAN_TRANSFER_ACCOUNT_NAME?.trim()
  return bankName && accountNumber && accountName ? { bankName, accountNumber, accountName } : null
}

/** Paystack card checkout, unless PLAN_CARD_PAYMENTS=off or there's no Paystack key. */
export function cardPaymentsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return !!env.PAYSTACK_SECRET_KEY && env.PLAN_CARD_PAYMENTS?.trim().toLowerCase() !== 'off'
}

/**
 * What the merchant puts in the transfer narration so staff can match the
 * money to them. Stable per merchant, so renewals use the same one.
 */
export function transferReference(merchantId: string): string {
  return `BVS-${merchantId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

// A plan paid by transfer doesn't renew itself; the merchant can pay for the
// next period from this many days before the current one ends.
export const TRANSFER_RENEW_DAYS = 10

type PlanState = {
  subscription_status?: string | null
  current_period_end?: string | null
  paystack_subscription_code?: string | null
}

/** Whether a merchant can send a transfer now: no paid plan, or one paid by transfer that ends soon. */
export function canPayByTransfer(merchant: PlanState | null | undefined, now = Date.now()): boolean {
  if (!hasActivePlan(merchant, now)) return true
  if (merchant?.subscription_status !== 'active' || merchant.paystack_subscription_code) return false
  const end = Date.parse(merchant.current_period_end ?? '')
  return end - TRANSFER_RENEW_DAYS * 24 * 60 * 60 * 1000 <= now
}

/** The beta first-month discount is for a merchant's first ever payment only. */
export function isFirstPayment(merchant: PlanState | null | undefined): boolean {
  return !merchant?.current_period_end && merchant?.subscription_status !== 'comped'
}

/** When a confirmed transfer's period starts: now, or when the current paid period ends. */
export function transferPeriodStart(merchant: PlanState | null | undefined, now = new Date()): Date {
  const end = merchant?.current_period_end ? new Date(merchant.current_period_end) : null
  return end && end > now && hasActivePlan(merchant, now.getTime()) ? end : now
}
