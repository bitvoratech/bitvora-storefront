'use client'

import { useState } from 'react'
import { BrandIcon } from './BrandIcon'

// "Post to Status": shares a ready-made 1080×1920 product image (photo,
// price, store link) straight into the phone's share sheet, so it can go
// onto WhatsApp Status or an Instagram Story in two taps. Browsers that can't
// share files (most desktops) download the image instead.
export function StatusShareButton({ slug, productSlug, text }: { slug: string; productSlug: string; text: string }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function share() {
    setBusy(true)
    setFailed(false)
    const imageUrl = `/${slug}/product/${productSlug}/status-image`
    try {
      const res = await fetch(imageUrl)
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      const file = new File([blob], `${productSlug}.png`, { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: `${text} ${window.location.href}` })
        } catch {
          // Share sheet dismissed.
        }
        return
      }

      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${productSlug}-status.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-3 py-1.5 text-xs font-medium text-[#525252] hover:text-[#171717] hover:border-[#a3a3a3] transition-colors disabled:opacity-50"
    >
      <BrandIcon icon="Whatsapp" className="w-3.5 h-3.5" />
      <span aria-live="polite">{busy ? 'Preparing…' : failed ? 'Try again' : 'Post to Status'}</span>
    </button>
  )
}
