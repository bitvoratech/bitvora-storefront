import Link from 'next/link'
import { IconCheck } from '@tabler/icons-react'

type ChecklistItem = { label: string; done: boolean; href?: string }

export function OnboardingChecklist({ items }: { items: ChecklistItem[] }) {
  const doneCount = items.filter((i) => i.done).length

  return (
    <div className="border border-indigo-600/20 bg-indigo-50 rounded-[var(--radius-card)] p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-indigo-900">Get your store ready</p>
        <span className="text-xs text-indigo-600 font-mono">{doneCount}/{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const content = (
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  item.done ? 'bg-palm-600' : 'bg-white dark:bg-sand-100 border border-sand-200'
                }`}
              >
                {item.done && <IconCheck className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-sm ${item.done ? 'text-ink/40 line-through' : 'text-ink'}`}>
                {item.label}
              </span>
            </div>
          )
          return item.href && !item.done ? (
            <Link key={item.label} href={item.href} className="block hover:opacity-70 transition-opacity">
              {content}
            </Link>
          ) : (
            <div key={item.label}>{content}</div>
          )
        })}
      </div>
    </div>
  )
}