'use client'

import { useState, useTransition } from 'react'
import { IconBell, IconCheck } from '@tabler/icons-react'
import { requestRestockAlert } from './actions'

export function RestockForm({ slug, productId, storeName, accent }: { slug: string; productId: string; storeName: string; accent: string }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const result = await requestRestockAlert(slug, productId, name, phone)
        if ('error' in result && result.error) setError(result.error)
        else setDone(true)
      } catch {
        setError('Could not save your request. Check your connection and try again.')
      }
    })
  }

  if (done) {
    return (
      <div role="status" className="mt-3 flex items-start gap-2 rounded-lg bg-green-50 px-3 py-3 text-sm text-green-800">
        <IconCheck className="w-4 h-4 mt-0.5 shrink-0" stroke={2} />
        You&apos;re on the list. {storeName} will message you on WhatsApp when it&apos;s back.
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-lg border border-[#e5e5e5] p-4 space-y-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <IconBell className="w-4 h-4" stroke={1.75} />
        Get a WhatsApp message when it&apos;s back
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label htmlFor="restock-name" className="sr-only">Your name (optional)</label>
          <input
            id="restock-name"
            autoComplete="given-name"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#171717]"
          />
        </div>
        <div>
          <label htmlFor="restock-phone" className="sr-only">WhatsApp number</label>
          <input
            id="restock-phone"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="WhatsApp number"
            className="w-full rounded-lg border border-[#e5e5e5] px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#171717]"
          />
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: accent }}
      >
        {isPending ? 'Saving…' : 'Notify me'}
      </button>
      <p className="text-xs text-[#737373]">Only {storeName} sees your number, and only to tell you about this item.</p>
    </form>
  )
}
