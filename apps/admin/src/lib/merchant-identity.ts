// NIN and CAC numbers are typed in by merchants at signup and checked by hand
// by a platform owner (owner console → Verifications); nothing here calls an
// external registry. These helpers only normalise and sanity-check the format.

/** 11-digit National Identification Number, with spaces/dashes stripped. */
export function normalizeNin(raw: string | null | undefined): string | null {
  const nin = (raw ?? '').replace(/[\s-]/g, '')
  return /^\d{11}$/.test(nin) ? nin : null
}

/**
 * What's kept of a NIN once an owner has approved it: only the last 4 digits,
 * e.g. *******8901. The full number isn't needed after the check, and not
 * holding it limits the damage of a leak.
 */
export function maskNin(nin: string): string {
  return '*'.repeat(7) + nin.slice(-4)
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

/**
 * Whether a merchant may pay for a plan and open stores. Only the phone OTP is
 * required: NIN/CAC compliance is optional and earns the Verified seller badge
 * (verification_status 'verified') rather than unlocking stores. Mirrors
 * public.current_merchant_can_create_store() in the database.
 */
export function canOpenStore(
  merchant: { phone_verified_at?: string | null; verification_status?: string | null } | null | undefined
): boolean {
  return !!merchant?.phone_verified_at || merchant?.verification_status === 'verified'
}

/** Merchants who skip compliance have this long before their stores go offline. */
export const COMPLIANCE_GRACE_DAYS = 30

/**
 * Whether a merchant's compliance deadline has passed without NIN/CAC being
 * sent (or after they were rejected). Their stores are hidden from the public
 * storefront until they send them. 'pending' isn't overdue: that's on us.
 * Mirrors public.merchant_compliance_overdue() in the database.
 */
export function complianceOverdue(
  merchant: { verification_status?: string | null; compliance_due_at?: string | null } | null | undefined,
  now = Date.now(),
): boolean {
  const status = merchant?.verification_status ?? 'unverified'
  if (status !== 'unverified' && status !== 'failed') return false
  const due = merchant?.compliance_due_at ? Date.parse(merchant.compliance_due_at) : NaN
  return Number.isFinite(due) && due <= now
}

/** Whole days left before the deadline (0 once it has passed), or null without one. */
export function complianceDaysLeft(dueAt: string | null | undefined, now = Date.now()): number | null {
  const due = dueAt ? Date.parse(dueAt) : NaN
  if (!Number.isFinite(due)) return null
  return Math.max(0, Math.ceil((due - now) / (24 * 60 * 60 * 1000)))
}
