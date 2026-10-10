import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { IconReceipt2, IconCash, IconPackage, IconClockHour4, IconCircleCheck, IconChevronRight, IconBell } from '@tabler/icons-react'

export type AttentionItem = {
  key: string
  count: number
  title: string
  detail: string
  href: string
  tone: 'urgent' | 'warning' | 'info'
}

const ICONS: Record<string, React.ComponentType<{ className?: string; stroke?: number }>> = {
  verify: IconReceipt2,
  confirm: IconCash,
  stock: IconPackage,
  awaiting: IconClockHour4,
  restock: IconBell,
}

const TONES: Record<AttentionItem['tone'], string> = {
  urgent: 'bg-pepper-50 text-pepper-600',
  warning: 'bg-marigold-50 text-marigold-500',
  info: 'bg-sand-100 text-ink/60',
}

// Task-first home: what the merchant should do right now comes before charts.
export function NeedsAttention({ items }: { items: AttentionItem[] }) {
  const active = items.filter((i) => i.count > 0)

  if (active.length === 0) {
    return (
      <Card className="mb-6 flex items-center gap-3 py-4">
        <IconCircleCheck className="w-5 h-5 text-palm-600 shrink-0" stroke={1.75} />
        <p className="text-sm">
          <span className="font-medium">All caught up.</span>{' '}
          <span className="text-ink/50">No orders or stock need your attention right now.</span>
        </p>
      </Card>
    )
  }

  return (
    <section aria-labelledby="needs-attention" className="mb-6">
      <h2 id="needs-attention" className="font-display text-sm font-semibold mb-3">Needs your attention</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {active.map((item) => {
          const Icon = ICONS[item.key] ?? IconClockHour4
          return (
            <Link
              key={item.key}
              href={item.href}
              className="group flex items-center gap-3 rounded-[var(--radius-card)] border border-sand-200 bg-white dark:bg-sand-100 p-3.5 hover:border-indigo-600/50 transition-colors"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONES[item.tone]}`}>
                <Icon className="w-5 h-5" stroke={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  <span className="font-mono">{item.count}</span> {item.title}
                </span>
                <span className="block text-xs text-ink/50 truncate">{item.detail}</span>
              </span>
              <IconChevronRight className="w-4 h-4 text-ink/30 group-hover:text-indigo-600 shrink-0" stroke={1.75} />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
