import { describe, expect, it } from 'vitest'
import { splitSections } from './sections'

describe('splitSections', () => {
  it('uses the default layout: hero and banners above, about and CTA below', () => {
    const { beforeProducts, afterProducts } = splitSections([
      { type: 'hero', position: 0 },
      { type: 'banner_grid', position: 1 },
      { type: 'about', position: 5 },
      { type: 'cta_banner', position: 10 },
    ])
    expect(beforeProducts.map((s) => s.type)).toEqual(['hero', 'banner_grid'])
    expect(afterProducts.map((s) => s.type)).toEqual(['about', 'cta_banner'])
  })

  it('keeps every section when the merchant reorders across the product grid', () => {
    // About swapped with the banner grid in the admin.
    const { beforeProducts, afterProducts } = splitSections([
      { type: 'hero', position: 0 },
      { type: 'about', position: 1 },
      { type: 'banner_grid', position: 5 },
      { type: 'cta_banner', position: 10 },
    ])
    expect(beforeProducts.map((s) => s.type)).toEqual(['hero', 'about'])
    expect(afterProducts.map((s) => s.type)).toEqual(['banner_grid', 'cta_banner'])
  })

  it('handles a store with no sections', () => {
    expect(splitSections(null)).toEqual({ beforeProducts: [], afterProducts: [] })
  })
})
