import { IconArrowRight } from '@tabler/icons-react'
import Link from 'next/link'

type ChecklistItem = { label: string; done: boolean; href?: string }

export function OnboardingProgress({
  storeId,
  items,
}: {
  storeId: string
  items: ChecklistItem[]
}) {
  const doneCount = items.filter((i) => i.done).length
  const remaining = items.length - doneCount
  const pct = Math.round((doneCount / items.length) * 100)

  if (remaining === 0) return null

  const nextStep = items.find((i) => !i.done)

  return (
    <Link
      href={nextStep?.href || `/stores/${storeId}/customize`}
      className="flex items-center gap-4 rounded-[var(--radius-card)] border border-sand-200 bg-white dark:bg-sand-100 p-3.5 mb-6 hover:border-indigo-600/40 transition-colors"
    >
      <div className="relative w-8 h-8 shrink-0">
        <svg width="32" height="32" className="-rotate-90">
          <circle cx="16" cy="16" r="13" stroke="var(--color-sand-200)" strokeWidth="3" fill="none" />
          <circle
            cx="16" cy="16" r="13"
            stroke="var(--color-marigold-500)" strokeWidth="3" fill="none"
            strokeDasharray={81.7}
            strokeDashoffset={81.7 - (81.7 * pct) / 100}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-semibold text-indigo-900">
          {doneCount}/{items.length}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Finish setting up your store</p>
        <p className="text-xs text-ink/50 truncate">
          {remaining} step{remaining === 1 ? '' : 's'} left — {nextStep?.label.toLowerCase()}
        </p>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 shrink-0">Continue <IconArrowRight className="w-3.5 h-3.5" /></span>
    </Link>
  )
}
