import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { IconClockHour4, IconAlertTriangle, IconId } from '@tabler/icons-react'
import { complianceDaysLeft } from '../lib/merchant-identity'

type Status = 'details_needed' | 'in_review' | 'rejected'

const COPY: Record<Status, { title: string; body: string; cta: string; icon: typeof IconClockHour4; tone: string }> = {
  details_needed: {
    title: 'Get your Verified seller badge',
    body: 'Add your NIN and CAC details and our team will check them. Verified sellers show a badge on their store that tells customers they can trust you.',
    cta: 'Complete verification',
    icon: IconId,
    tone: 'bg-indigo-50 text-indigo-600',
  },
  in_review: {
    title: 'We’re checking your details',
    body: 'Our team is reviewing your NIN and CAC. Once they’re approved, your store gets the Verified seller badge.',
    cta: 'View or edit details',
    icon: IconClockHour4,
    tone: 'bg-marigold-50 text-marigold-500',
  },
  rejected: {
    title: 'We couldn’t verify your details',
    body: 'Update them and send them again to get your Verified seller badge.',
    cta: 'Update details',
    icon: IconAlertTriangle,
    tone: 'bg-pepper-50 text-pepper-600',
  },
}

export function VerificationStatusCard({
  status,
  note,
  dueAt = null,
  overdue = false,
}: {
  status: Status
  note: string | null
  dueAt?: string | null
  overdue?: boolean
}) {
  const c = COPY[status]
  const Icon = overdue ? IconAlertTriangle : c.icon
  // Merchants who skipped (or were rejected) have a deadline; once it passes
  // their stores are offline until they send their details.
  const daysLeft = status === 'in_review' ? null : complianceDaysLeft(dueAt)
  const deadline = overdue
    ? 'Your store is disabled and hidden from customers until you send your NIN and CAC.'
    : daysLeft !== null
      ? `Your store will be disabled in ${daysLeft} day${daysLeft === 1 ? '' : 's'} if you don’t.`
      : null

  return (
    <Card className="flex flex-col sm:flex-row sm:items-center gap-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${overdue ? COPY.rejected.tone : c.tone}`}>
        <Icon className="w-5 h-5" stroke={1.75} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{c.title}</p>
        <p className="text-sm text-ink/50 mt-0.5">
          {status === 'rejected' && note ? `${note} ` : ''}
          {c.body}
        </p>
        {deadline && <p className={`text-sm font-medium mt-1 ${overdue ? 'text-pepper-600' : 'text-marigold-500'}`}>{deadline}</p>}
      </div>
      <Link
        href="/verify"
        className="shrink-0 self-start sm:self-auto text-sm rounded-lg px-4 py-2 font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
      >
        {c.cta}
      </Link>
    </Card>
  )
}
