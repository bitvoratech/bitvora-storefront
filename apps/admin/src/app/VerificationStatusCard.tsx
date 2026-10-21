import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { IconClockHour4, IconAlertTriangle, IconId } from '@tabler/icons-react'

type Status = 'details_needed' | 'in_review' | 'rejected'

const COPY: Record<Status, { title: string; body: string; cta: string; icon: typeof IconClockHour4; tone: string }> = {
  details_needed: {
    title: 'Add your NIN and CAC details',
    body: 'Your phone is verified. Send us your business details so we can check them, then you can create your store.',
    cta: 'Add details',
    icon: IconId,
    tone: 'bg-indigo-50 text-indigo-600',
  },
  in_review: {
    title: 'We’re checking your details',
    body: 'Our team is reviewing your NIN and CAC. We’ll text you as soon as they’re approved, and then you can create your store.',
    cta: 'View or edit details',
    icon: IconClockHour4,
    tone: 'bg-marigold-50 text-marigold-500',
  },
  rejected: {
    title: 'We couldn’t verify your details',
    body: 'Update them and send them again.',
    cta: 'Update details',
    icon: IconAlertTriangle,
    tone: 'bg-pepper-50 text-pepper-600',
  },
}

export function VerificationStatusCard({ status, note }: { status: Status; note: string | null }) {
  const c = COPY[status]
  const Icon = c.icon

  return (
    <Card className="flex flex-col sm:flex-row sm:items-center gap-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.tone}`}>
        <Icon className="w-5 h-5" stroke={1.75} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{c.title}</p>
        <p className="text-sm text-ink/50 mt-0.5">
          {status === 'rejected' && note ? `${note} ` : ''}
          {c.body}
        </p>
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
