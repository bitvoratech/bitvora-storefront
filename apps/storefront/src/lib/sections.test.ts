import { describe, expect, it } from 'vitest'
import { collectionTileHref, splitSections } from './sections'

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

describe('collectionTileHref', () => {
  const categories = new Map([['dresses', 'Dresses'], ['bags & shoes', 'Bags & Shoes']])

  it('opens the store filtered to the tile’s category, ignoring case', () => {
    expect(collectionTileHref('demo-store', 'dresses', categories)).toBe('/demo-store?category=Dresses#products')
    expect(collectionTileHref('demo-store', 'Bags & Shoes', categories)).toBe('/demo-store?category=Bags%20%26%20Shoes#products')
  })

  it('falls back to all products with no category or one with no products left', () => {
    expect(collectionTileHref('demo-store', undefined, categories)).toBe('#products')
    expect(collectionTileHref('demo-store', '', categories)).toBe('#products')
    expect(collectionTileHref('demo-store', 'Hats', categories)).toBe('#products')
  })
})
