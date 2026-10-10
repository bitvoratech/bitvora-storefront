// Server-side check that a URL is a payment proof uploaded to *our* Cloudinary
// account through the signed upload flow (see api/cloudinary-signature).
export const PAYMENT_PROOF_FOLDER = 'bitvora-storefront/payment-proofs'

export function isPaymentProofUrl(url: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  if (!cloudName || typeof url !== 'string' || url.length > 500) return false
  return (
    url.startsWith(`https://res.cloudinary.com/${cloudName}/image/upload/`) &&
    url.includes(`/${PAYMENT_PROOF_FOLDER}/`)
  )
}
