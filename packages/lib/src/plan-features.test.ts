import { describe, expect, it } from 'vitest'
import { hasFullCustomization, sectionAllowed } from './plan-features'

describe('hasFullCustomization', () => {
  it('is Growth and Pro only', () => {
    expect(hasFullCustomization('starter')).toBe(false)
    expect(hasFullCustomization('growth')).toBe(true)
    expect(hasFullCustomization('pro')).toBe(true)
    expect(hasFullCustomization(null)).toBe(false)
    expect(hasFullCustomization('enterprise')).toBe(false)
  })
})

describe('sectionAllowed', () => {
  it('gives Starter the hero only', () => {
    expect(sectionAllowed('starter', 'hero')).toBe(true)
    expect(sectionAllowed('starter', 'about')).toBe(false)
    expect(sectionAllowed('starter', 'banner_grid')).toBe(false)
    expect(sectionAllowed('starter', 'cta_banner')).toBe(false)
    expect(sectionAllowed('growth', 'about')).toBe(true)
  })
})
