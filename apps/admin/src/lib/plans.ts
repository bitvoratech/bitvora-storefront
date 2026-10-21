// Plan ids and names, mirroring apps/website/src/lib/plans.ts (the source of
// prices and limits). Only what the admin needs to record and show a plan.

export const PLAN_NAMES = { starter: 'Starter', growth: 'Growth', pro: 'Pro' } as const
export type PlanId = keyof typeof PLAN_NAMES
export type PlanInterval = 'monthly' | 'annual'

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
