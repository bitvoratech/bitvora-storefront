import { describe, expect, it } from 'vitest'
import { readableTextOn } from './color'

describe('readableTextOn', () => {
  it('uses white on dark brand colors', () => {
    expect(readableTextOn('#171717')).toBe('#ffffff')
    expect(readableTextOn('#2A3B8F')).toBe('#ffffff')
    expect(readableTextOn('#C1443B')).toBe('#ffffff')
  })

  it('uses dark text on light brand colors', () => {
    expect(readableTextOn('#E8A33D')).toBe('#171717')
    expect(readableTextOn('#ffeb3b')).toBe('#171717')
    expect(readableTextOn('#fff')).toBe('#171717')
  })

  it('falls back to white for values it cannot read', () => {
    expect(readableTextOn('not-a-color')).toBe('#ffffff')
  })
})
