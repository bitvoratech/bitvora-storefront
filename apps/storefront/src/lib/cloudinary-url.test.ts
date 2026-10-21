import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isPaymentProofUrl } from './cloudinary-url'

describe('isPaymentProofUrl', () => {
  beforeEach(() => vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'demo'))
  afterEach(() => vi.unstubAllEnvs())

  it('accepts proofs uploaded to our cloud and folder', () => {
    expect(isPaymentProofUrl('https://res.cloudinary.com/demo/image/upload/v1/bitvora-storefront/payment-proofs/x.jpg')).toBe(true)
  })

  it('rejects other clouds, folders and hosts', () => {
    expect(isPaymentProofUrl('https://res.cloudinary.com/other/image/upload/v1/bitvora-storefront/payment-proofs/x.jpg')).toBe(false)
    expect(isPaymentProofUrl('https://res.cloudinary.com/demo/image/upload/v1/bitvora-storefront/products/x.jpg')).toBe(false)
    expect(isPaymentProofUrl('https://evil.example/res.cloudinary.com/demo/image/upload/bitvora-storefront/payment-proofs/x.jpg')).toBe(false)
  })

  it('rejects everything when Cloudinary is not configured', () => {
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', '')
    expect(isPaymentProofUrl('https://res.cloudinary.com/demo/image/upload/v1/bitvora-storefront/payment-proofs/x.jpg')).toBe(false)
  })
})
