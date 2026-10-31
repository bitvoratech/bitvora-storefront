import { describe, expect, it } from 'vitest'
import { normalizeSizePrices, normalizeSizes, priceForSize, splitSizes } from './product-sizes'

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

describe('normalizeSizePrices', () => {
  it('keeps prices for the product\'s sizes in its spelling and drops blanks', () => {
    expect(normalizeSizePrices({ ' 2ft X 6ft ': '85000.555', '3ft x 7ft': '', gone: 10 }, ['2ft x 6ft', '3ft x 7ft'])).toEqual({
      ok: true,
      sizePrices: { '2ft x 6ft': 85000.56 },
    })
  })

  it('refuses bad prices', () => {
    expect(normalizeSizePrices({ XL: '-5' }, ['XL']).ok).toBe(false)
    expect(normalizeSizePrices([], ['XL']).ok).toBe(false)
  })
})

describe('priceForSize', () => {
  it('uses the size price when set, else the product price', () => {
    expect(priceForSize(100, { XL: 150 }, 'XL')).toBe(150)
    expect(priceForSize(100, { XL: 150 }, 'M')).toBe(100)
    expect(priceForSize(100, null, null)).toBe(100)
  })
})
