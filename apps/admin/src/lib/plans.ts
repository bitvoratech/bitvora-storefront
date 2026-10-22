// Plan ids, names and prices, mirroring apps/website/src/lib/plans.ts (the
// marketing copy). plans.test.ts checks the two stay in step.

export const PLAN_NAMES = { starter: 'Starter', growth: 'Growth', pro: 'Pro' } as const
export type PlanId = keyof typeof PLAN_NAMES
export type PlanInterval = 'monthly' | 'annual'

export const PLAN_IDS = Object.keys(PLAN_NAMES) as PlanId[]

/** ₦ per month, billed monthly. */
export const PLAN_MONTHLY: Record<PlanId, number> = { starter: 5000, growth: 12000, pro: 25000 }

export const PLAN_STORE_LIMIT: Record<PlanId, number> = { starter: 1, growth: 2, pro: 5 }

/** Short summary for the signup plan picker. */
export const PLAN_SUMMARY: Record<PlanId, string> = {
  starter: '1 store · 30 products per store',
  growth: '2 stores · 150 products per store',
  pro: '5 stores · unlimited products',
}

// 2 months free on annual (pay for 10, get 12).
export const ANNUAL_MONTHS = 10

export function parsePlan(value: unknown): PlanId | null {
  return typeof value === 'string' && Object.hasOwn(PLAN_NAMES, value) ? (value as PlanId) : null
}

export function parseInterval(value: unknown): PlanInterval | null {
  return value === 'monthly' || value === 'annual' ? value : null
}

/** "Growth · annual", or null when no plan was picked. */
export function planLabel(plan: string | null | undefined, interval?: string | null): string | null {
  const id = parsePlan(plan)
  if (!id) return null
  const i = parseInterval(interval)
  return i ? `${PLAN_NAMES[id]} · ${i}` : PLAN_NAMES[id]
}

/** ₦ charged per billing period. */
export function planPrice(plan: PlanId, interval: PlanInterval): number {
  return interval === 'annual' ? PLAN_MONTHLY[plan] * ANNUAL_MONTHS : PLAN_MONTHLY[plan]
}

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`
}

export type SubscriptionStatus = 'active' | 'non_renewing' | 'past_due' | 'cancelled' | 'comped'

// Paystack retries a failed renewal over a few days; keep the store usable
// meanwhile rather than locking a merchant out the moment a card declines.
const GRACE_MS = 3 * 24 * 60 * 60 * 1000

/** Whether a merchant's plan is paid up (or granted free by the owner). */
export function hasActivePlan(
  merchant: { subscription_status?: string | null; current_period_end?: string | null } | null | undefined,
  now = Date.now(),
): boolean {
  const status = merchant?.subscription_status
  if (status === 'comped') return true
  if (status !== 'active' && status !== 'non_renewing' && status !== 'past_due') return false
  const end = merchant?.current_period_end ? Date.parse(merchant.current_period_end) : NaN
  return Number.isFinite(end) && end + GRACE_MS > now
}
