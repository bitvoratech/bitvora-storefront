import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { isValidSignature, paystackPlanName, periodEnd, readMetadata } from './paystack'

describe('isValidSignature', () => {
  const key = 'sk_test_example'
  const body = '{"event":"charge.success","data":{}}'
  const good = createHmac('sha512', key).update(body).digest('hex')

  it('accepts only the HMAC of the raw body', () => {
    expect(isValidSignature(body, good, key)).toBe(true)
    expect(isValidSignature(body + ' ', good, key)).toBe(false)
    expect(isValidSignature(body, (good[0] === 'a' ? 'b' : 'a') + good.slice(1), key)).toBe(false)
    expect(isValidSignature(body, null, key)).toBe(false)
    expect(isValidSignature(body, good, undefined)).toBe(false)
  })
})

describe('periodEnd', () => {
  it('adds a month or a year', () => {
    const from = new Date('2026-10-22T09:00:00Z')
    expect(periodEnd(from, 'monthly').toISOString()).toBe('2026-11-22T09:00:00.000Z')
    expect(periodEnd(from, 'annual').toISOString()).toBe('2027-10-22T09:00:00.000Z')
  })
})

describe('readMetadata', () => {
  it('reads objects and JSON strings', () => {
    expect(readMetadata({ merchant_id: 'm1' })).toEqual({ merchant_id: 'm1' })
    expect(readMetadata('{"plan":"pro"}')).toEqual({ plan: 'pro' })
    expect(readMetadata('not json')).toEqual({})
    expect(readMetadata(null)).toEqual({})
  })
})

describe('paystackPlanName', () => {
  it('names plans by tier and interval', () => {
    expect(paystackPlanName('growth', 'annual')).toBe('Bitvora Stores Growth (annual)')
  })
})
