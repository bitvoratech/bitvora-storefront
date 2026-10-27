import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react'

// Trust signal: shown only for sellers whose NIN and CAC an owner approved.
// That check is optional at signup, so the badge is what sets them apart for
// customers paying a stranger by bank transfer.
// `detail` is rendered inside the badge so the label and the sentence share one
// line box: same size, same baseline, and the text wraps under itself on mobile
// while the icon stays pinned to the first line.
export function VerifiedBadge({
  variant = 'pill',
  detail,
  className = '',
}: {
  variant?: 'pill' | 'inline'
  detail?: React.ReactNode
  className?: string
}) {
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-start gap-1.5 text-xs leading-4 text-[#525252] ${className}`}>
        <IconRosetteDiscountCheckFilled className="w-4 h-4 shrink-0 text-sky-600" aria-hidden="true" />
        <span>
          <span className="font-medium text-[#404040]">Verified seller</span>
          {detail && <span className="text-[#737373]"> · {detail}</span>}
        </span>
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
