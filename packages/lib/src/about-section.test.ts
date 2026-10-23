import { describe, expect, it } from 'vitest'
import { aboutParagraphs, isAboutEmpty, normalizeAbout } from './about-section'

describe('normalizeAbout', () => {
  it('reads old heading + body rows', () => {
    expect(normalizeAbout({ heading: ' Our story ', body: 'We make bags.' })).toEqual({
      heading: 'Our story',
      body: 'We make bags.',
      image_url: '',
      highlights: [],
    })
  })

  it('tolerates missing or malformed config', () => {
    expect(isAboutEmpty(normalizeAbout(null))).toBe(true)
    expect(normalizeAbout({ heading: 4, highlights: 'nope' }).highlights).toEqual([])
  })

  it('drops empty highlights, caps them at three, and ignores non-https images', () => {
    const a = normalizeAbout({ highlights: ['Handmade', ' ', 'Lagos', 'Since 2019', 'Extra'], image_url: 'javascript:alert(1)' })
    expect(a.highlights).toEqual(['Handmade', 'Lagos', 'Since 2019'])
    expect(a.image_url).toBe('')
  })
})

describe('aboutParagraphs', () => {
  it('splits on blank lines and keeps single line breaks', () => {
    expect(aboutParagraphs('One\nstill one\n\n\nTwo\r\n')).toEqual(['One\nstill one', 'Two'])
  })
})
