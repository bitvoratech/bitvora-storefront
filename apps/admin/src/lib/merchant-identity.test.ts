import { describe, expect, it } from 'vitest'
import { normalizeCac, normalizeNin } from './merchant-identity'

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
