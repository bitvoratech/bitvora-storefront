import { describe, expect, it } from 'vitest'
import { normalizeNigerianPhone } from './termii'

describe('normalizeNigerianPhone', () => {
  it.each([
    ['08012345678', '2348012345678'],
    ['8012345678', '2348012345678'],
    ['+2348012345678', '2348012345678'],
    ['2348012345678', '2348012345678'],
    ['+234 (0) 801 234 5678', '2348012345678'],
    ['002348012345678', '2348012345678'],
    ['0703-123-4567', '2347031234567'],
    ['09112345678', '2349112345678'],
  ])('normalizes %s', (raw, expected) => {
    expect(normalizeNigerianPhone(raw)).toBe(expected)
  })

  it.each(['', '0801234567', '080123456789', '+447911123456', '02012345678', 'abc'])('rejects %s', (raw) => {
    expect(() => normalizeNigerianPhone(raw)).toThrow()
  })
})
