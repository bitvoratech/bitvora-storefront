// NIN and CAC numbers are typed in by merchants at signup and checked by hand
// by a platform owner (owner console → Verifications); nothing here calls an
// external registry. These helpers only normalise and sanity-check the format.

/** 11-digit National Identification Number, with spaces/dashes stripped. */
export function normalizeNin(raw: string | null | undefined): string | null {
  const nin = (raw ?? '').replace(/[\s-]/g, '')
  return /^\d{11}$/.test(nin) ? nin : null
}

/**
 * CAC registration number: RC (company), BN (business name) or IT
 * (incorporated trustees) followed by digits. A bare number is accepted too.
 */
export function normalizeCac(raw: string | null | undefined): string | null {
  const cac = (raw ?? '').replace(/[\s-]/g, '').toUpperCase()
  return /^(RC|BN|IT)?\d{1,10}$/.test(cac) ? cac : null
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed'
