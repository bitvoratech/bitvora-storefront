import { describe, expect, it } from 'vitest'
import { parseInterval, parsePlan, planLabel } from './plans'

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
