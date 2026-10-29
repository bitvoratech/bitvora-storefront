import { describe, expect, it } from 'vitest'
import { timeAgo } from './time-ago'

describe('timeAgo', () => {
  const now = new Date('2026-10-29T12:00:00Z')
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()

  it('rounds down to the largest unit', () => {
    expect(timeAgo(ago(30_000), now)).toBe('just now')
    expect(timeAgo(ago(5 * 60_000), now)).toBe('5m ago')
    expect(timeAgo(ago(3 * 3_600_000), now)).toBe('3h ago')
    expect(timeAgo(ago(2 * 86_400_000), now)).toBe('2d ago')
  })

  it('treats future times as just now', () => {
    expect(timeAgo(ago(-60_000), now)).toBe('just now')
  })
})
