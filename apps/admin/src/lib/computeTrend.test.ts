import { describe, expect, it } from 'vitest'
import { computeTrend } from './computeTrend'

describe('computeTrend', () => {
  it('is flat with no label when both periods are zero', () => {
    expect(computeTrend(0, 0, 'vs last week')).toEqual({ label: undefined, trend: 'flat' })
  })

  it('reports growth from zero as new', () => {
    expect(computeTrend(5, 0, 'vs last week')).toEqual({ label: 'New vs last week', trend: 'up' })
  })

  it('reports rounded percentage changes', () => {
    expect(computeTrend(150, 100, 'vs last week')).toEqual({ label: '50% vs last week', trend: 'up' })
    expect(computeTrend(75, 100, 'vs last week')).toEqual({ label: '25% vs last week', trend: 'down' })
  })

  it('treats changes that round to 0% as flat', () => {
    expect(computeTrend(1000, 999, 'vs last week')).toEqual({ label: 'Flat vs last week', trend: 'flat' })
  })
})
