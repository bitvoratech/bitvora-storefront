import { describe, expect, it } from 'vitest'
import { normalizeSizes, splitSizes } from './product-sizes'

describe('splitSizes', () => {
  it('splits on commas and tidies spaces', () => {
    expect(splitSizes(' S, M ,  XL ,, ')).toEqual(['S', 'M', 'XL'])
    expect(splitSizes('16   inches')).toEqual(['16 inches'])
  })
})

describe('normalizeSizes', () => {
  it('keeps the merchant spelling and drops repeats', () => {
    expect(normalizeSizes(['XL', ' xl ', '3 feet', ''])).toEqual({ ok: true, sizes: ['XL', '3 feet'] })
  })

  it('allows no sizes', () => {
    expect(normalizeSizes([])).toEqual({ ok: true, sizes: [] })
  })

  it('rejects bad input', () => {
    expect(normalizeSizes('XL').ok).toBe(false)
    expect(normalizeSizes([42]).ok).toBe(false)
    expect(normalizeSizes(['x'.repeat(41)]).ok).toBe(false)
    expect(normalizeSizes(Array.from({ length: 31 }, (_, i) => `${i}`)).ok).toBe(false)
  })
})
