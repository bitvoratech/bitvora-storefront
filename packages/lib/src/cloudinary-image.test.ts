import { describe, expect, it } from 'vitest'
import { cldImage, cldJpeg } from './cloudinary-image'

const URL = 'https://res.cloudinary.com/demo/image/upload/v123/bitvora-storefront/products/a.jpg'

describe('cldImage', () => {
  it('adds resize and auto-format transforms to Cloudinary URLs', () => {
    expect(cldImage(URL, 800)).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_800/v123/bitvora-storefront/products/a.jpg'
    )
  })

  it('leaves other URLs alone and handles empty input', () => {
    expect(cldImage('https://example.com/a.jpg', 800)).toBe('https://example.com/a.jpg')
    expect(cldImage(null, 800)).toBe('')
    expect(cldImage(undefined, 800)).toBe('')
  })
})

describe('cldJpeg', () => {
  it('crops Cloudinary URLs to an exact JPEG box', () => {
    expect(cldJpeg(URL, 1080, 1920)).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_jpg,q_80,c_fill,g_auto,w_1080,h_1920/v123/bitvora-storefront/products/a.jpg'
    )
  })

  it('returns null for empty input', () => {
    expect(cldJpeg(null, 10, 10)).toBeNull()
  })
})
