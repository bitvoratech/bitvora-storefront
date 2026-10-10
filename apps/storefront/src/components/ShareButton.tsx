'use client'

import { useState } from 'react'
import { IconShare2 } from '@tabler/icons-react'

// Customers sell for the merchant: one tap opens the phone's share sheet
// (WhatsApp Status, Instagram, a friend's chat…). Falls back to a WhatsApp
// share link on browsers without the Web Share API.
export function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch {
        // User cancelled the share sheet — nothing to do.
        return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener')
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-3 py-1.5 text-xs font-medium text-[#525252] hover:text-[#171717] hover:border-[#a3a3a3] transition-colors"
    >
      <IconShare2 className="w-3.5 h-3.5" stroke={1.75} />
      <span aria-live="polite">{copied ? 'Link copied' : 'Share'}</span>
    </button>
  )
}
