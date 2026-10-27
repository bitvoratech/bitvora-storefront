import { describe, expect, it } from 'vitest'
import { maskNin, normalizeCac, normalizeNin, canOpenStore, complianceDaysLeft, complianceOverdue } from './merchant-identity'

describe('normalizeNin', () => {
  it('accepts 11 digits, ignoring spaces and dashes', () => {
    expect(normalizeNin('12345678901')).toBe('12345678901')
    expect(normalizeNin('123 4567 8901')).toBe('12345678901')
    expect(normalizeNin('123-4567-8901')).toBe('12345678901')
  })

  it.each(['', '1234567890', '123456789012', 'ABCDEFGHIJK', null, undefined])('rejects %s', (raw) => {
    expect(normalizeNin(raw)).toBeNull()
  })
})

describe('normalizeCac', () => {
  it('accepts RC, BN and IT numbers in any case', () => {
    expect(normalizeCac('RC123456')).toBe('RC123456')
    expect(normalizeCac('rc 123456')).toBe('RC123456')
    expect(normalizeCac('BN-2345678')).toBe('BN2345678')
    expect(normalizeCac('IT12345')).toBe('IT12345')
    expect(normalizeCac('123456')).toBe('123456')
  })

  it.each(['', 'RC', 'XX123', 'RC12345678901', null])('rejects %s', (raw) => {
    expect(normalizeCac(raw)).toBeNull()
  })
})

describe('maskNin', () => {
  it('keeps only the last 4 digits', () => {
    expect(maskNin('12345678901')).toBe('*******8901')
  })
})

describe('canOpenStore', () => {
  it('needs only a verified phone', () => {
    expect(canOpenStore({ phone_verified_at: '2026-10-26T00:00:00Z', verification_status: 'unverified' })).toBe(true)
    expect(canOpenStore({ phone_verified_at: null, verification_status: 'unverified' })).toBe(false)
    expect(canOpenStore({ phone_verified_at: null, verification_status: 'verified' })).toBe(true)
    expect(canOpenStore(null)).toBe(false)
  })
})

describe('complianceOverdue', () => {
  const now = Date.parse('2026-11-30T00:00:00Z')
  const past = '2026-11-25T00:00:00Z'
  const future = '2026-12-05T00:00:00Z'

  it('is overdue only past the deadline without details sent or approved', () => {
    expect(complianceOverdue({ verification_status: 'unverified', compliance_due_at: past }, now)).toBe(true)
    expect(complianceOverdue({ verification_status: 'failed', compliance_due_at: past }, now)).toBe(true)
    expect(complianceOverdue({ verification_status: 'unverified', compliance_due_at: future }, now)).toBe(false)
    expect(complianceOverdue({ verification_status: 'pending', compliance_due_at: past }, now)).toBe(false)
    expect(complianceOverdue({ verification_status: 'verified', compliance_due_at: past }, now)).toBe(false)
    expect(complianceOverdue({ verification_status: 'unverified', compliance_due_at: null }, now)).toBe(false)
  })

  it('counts whole days left', () => {
    expect(complianceDaysLeft(future, now)).toBe(5)
    expect(complianceDaysLeft(past, now)).toBe(0)
    expect(complianceDaysLeft(null, now)).toBe(null)
  })
})
