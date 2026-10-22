import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { IconCreditCard } from '@tabler/icons-react'

// Shown to verified merchants whose plan isn't paid: never paid, or lapsed.
export function PayForPlanCard({ plan, lapsed }: { plan: string | null; lapsed: boolean }) {
  return (
    <Card className="flex flex-col sm:flex-row sm:items-center gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <IconCreditCard className="w-5 h-5" stroke={1.75} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{lapsed ? 'Your plan has ended' : 'You’re approved. Pay for your plan'}</p>
        <p className="text-sm text-ink/50 mt-0.5">
          {lapsed
            ? 'Renew your plan to create new stores.'
            : `${plan ? `You picked ${plan}. ` : ''}Pay with Paystack, then create your first store.`}
        </p>
      </div>
      <Link
        href="/billing"
        className="shrink-0 self-start sm:self-auto text-sm rounded-lg px-4 py-2 font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
      >
        {lapsed ? 'Renew plan' : 'Pay for plan'}
      </Link>
    </Card>
  )
}
