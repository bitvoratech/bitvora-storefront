// Paying for a plan by bank transfer, as a stopgap while Paystack card
// payments aren't available. The merchant transfers to the account set in env,
// says they've paid on /billing, and staff confirm it in Owner console → Plan
// payments, which activates the plan for the paid period. Server-only.

import { PLAN_IDS, PLAN_MONTHLY, hasActivePlan, parsePlan, planPrice, type PlanId, type PlanInterval } from './plans'

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

const DAY_MS = 24 * 60 * 60 * 1000
// A billing period's length when pricing an upgrade, so a period already
// extended by a renewal is charged for all of its remaining days.
const PERIOD_DAYS: Record<PlanInterval, number> = { monthly: 30, annual: 365 }

type UpgradeState = PlanState & { plan?: string | null }

/** Plans above the merchant's current one, cheapest first. */
export function higherPlans(plan: string | null | undefined): PlanId[] {
  const current = parsePlan(plan)
  if (!current) return []
  return PLAN_IDS.filter((id) => PLAN_MONTHLY[id] > PLAN_MONTHLY[current])
}

/**
 * Whether a merchant can upgrade mid-period by transfer: a plan paid by
 * transfer with at least a day left and somewhere to go. Card subscriptions
 * change plan through Paystack; comped plans through staff.
 */
export function canUpgradeByTransfer(merchant: UpgradeState | null | undefined, now = Date.now()): boolean {
  if (merchant?.subscription_status !== 'active' || merchant.paystack_subscription_code) return false
  if (higherPlans(merchant.plan).length === 0) return false
  return Date.parse(merchant.current_period_end ?? '') - now >= DAY_MS
}

/**
 * ₦ to move from one plan to a higher one for the rest of the paid period:
 * the price difference for the days left, rounded up to the next ₦100.
 * 0 when it isn't an upgrade or nothing is left.
 */
export function upgradePrice(
  from: PlanId,
  to: PlanId,
  interval: PlanInterval,
  periodEnd: string | null | undefined,
  now = Date.now(),
): number {
  const diff = planPrice(to, interval) - planPrice(from, interval)
  const daysLeft = Math.ceil((Date.parse(periodEnd ?? '') - now) / DAY_MS)
  if (!(diff > 0) || !(daysLeft > 0)) return 0
  return Math.ceil((diff * daysLeft) / PERIOD_DAYS[interval] / 100) * 100
}
