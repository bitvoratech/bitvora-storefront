import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react'

// Trust signal: every seller is identity-checked (NIN or CAC) before they can
// open a store. Customers paying a stranger by bank transfer should see that.
export function VerifiedBadge({ variant = 'pill' }: { variant?: 'pill' | 'inline' }) {
  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#525252]">
        <IconRosetteDiscountCheckFilled className="w-4 h-4 text-sky-600" aria-hidden="true" />
        Verified seller
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-800"
      title="This seller's identity was verified by Bitvora"
    >
      <IconRosetteDiscountCheckFilled className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
      <span className="hidden sm:inline">Verified seller</span>
      <span className="sm:hidden sr-only">Verified seller</span>
    </span>
  )
}
