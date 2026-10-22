import { describe, expect, it } from 'vitest'
import { ANNUAL_MONTHS, PLAN_IDS, PLAN_MONTHLY, hasActivePlan, parseInterval, parsePlan, planLabel, planPrice } from './plans'

describe('parsePlan', () => {
  it('accepts known plan ids only', () => {
    expect(parsePlan('growth')).toBe('growth')
    expect(parsePlan('enterprise')).toBeNull()
    expect(parsePlan('toString')).toBeNull()
    expect(parsePlan(null)).toBeNull()
  })
})

describe('parseInterval', () => {
  it('accepts monthly and annual', () => {
    expect(parseInterval('annual')).toBe('annual')
    expect(parseInterval('weekly')).toBeNull()
  })
})

describe('planLabel', () => {
  it('names the plan and interval', () => {
    expect(planLabel('pro', 'annual')).toBe('Pro · annual')
    expect(planLabel('starter', null)).toBe('Starter')
    expect(planLabel(null, 'monthly')).toBeNull()
  })
})

describe('prices', () => {
  it('match the marketing site', async () => {
    const site = await import('../../../website/src/lib/plans')
    for (const p of site.PLANS) {
      expect(PLAN_MONTHLY[p.id]).toBe(p.monthly)
      expect(planPrice(p.id, 'annual')).toBe(p.monthly * site.ANNUAL_MONTHS)
    }
    expect(ANNUAL_MONTHS).toBe(site.ANNUAL_MONTHS)
    expect(PLAN_IDS).toEqual(site.PLANS.map((p) => p.id))
  })
})

describe('hasActivePlan', () => {
  const now = Date.parse('2026-10-22T12:00:00Z')
  const day = 24 * 60 * 60 * 1000
  const at = (offsetDays: number) => new Date(now + offsetDays * day).toISOString()

  it('needs a paid period that has not run out', () => {
    expect(hasActivePlan({ subscription_status: 'active', current_period_end: at(10) }, now)).toBe(true)
    expect(hasActivePlan({ subscription_status: 'non_renewing', current_period_end: at(1) }, now)).toBe(true)
    expect(hasActivePlan({ subscription_status: 'active', current_period_end: at(-5) }, now)).toBe(false)
    expect(hasActivePlan({ subscription_status: 'cancelled', current_period_end: at(10) }, now)).toBe(false)
    expect(hasActivePlan({ subscription_status: null, current_period_end: null }, now)).toBe(false)
    expect(hasActivePlan(null, now)).toBe(false)
  })

  it('allows a short grace while Paystack retries a renewal', () => {
    expect(hasActivePlan({ subscription_status: 'past_due', current_period_end: at(-2) }, now)).toBe(true)
    expect(hasActivePlan({ subscription_status: 'past_due', current_period_end: at(-4) }, now)).toBe(false)
  })

  it('treats comped accounts as paid', () => {
    expect(hasActivePlan({ subscription_status: 'comped', current_period_end: null }, now)).toBe(true)
  })
})
