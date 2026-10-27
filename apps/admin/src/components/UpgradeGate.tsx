'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { IconLock } from '@tabler/icons-react'
import { Button } from '@bitvora/ui/src/Button'

/** The popup shown when a merchant reaches for something their plan doesn't include. */
export function UpgradeDialog({ open, onClose, title, message }: { open: boolean; onClose: () => void; title: string; message: string }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-sand-200 bg-white dark:bg-sand-100 p-0 text-ink shadow-xl backdrop:bg-black/40"
    >
      <div className="p-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
          <IconLock className="w-5 h-5 text-indigo-600" stroke={1.75} />
        </div>
        <h2 className="text-lg font-display font-semibold mb-1.5">{title}</h2>
        <p className="text-sm text-ink/60 mb-5">{message}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/billing" className="flex-1">
            <Button className="w-full">See plans &amp; upgrade</Button>
          </Link>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Not now
          </Button>
        </div>
      </div>
    </dialog>
  )
}

/**
 * A link that works while the plan allows it, and otherwise opens the
 * upgrade popup instead of sending the merchant to a form that will refuse them.
 */
export function UpgradeGate({
  href,
  locked,
  title,
  message,
  className,
  children,
}: {
  href: string
  locked: boolean
  title: string
  message: string
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  if (!locked) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <>
      <span role="button" tabIndex={0} onClick={() => setOpen(true)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen(true))} className={`cursor-pointer ${className ?? ''}`}>
        {children}
      </span>
      <UpgradeDialog open={open} onClose={() => setOpen(false)} title={title} message={message} />
    </>
  )
}
