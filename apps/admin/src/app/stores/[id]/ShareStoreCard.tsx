'use client'

import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { IconCheck, IconCopy, IconDownload, IconQrcode } from '@tabler/icons-react'
import { Card } from '@bitvora/ui/src/Card'

// Sharing the link is how a store gets its first customers, so it gets a
// prominent home on the dashboard: copy, WhatsApp, and a printable QR code.
export function ShareStoreCard({ url, storeName, isPublished }: { url: string; storeName: string; isPublished: boolean }) {
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const displayUrl = url.replace(/^https?:\/\//, '')
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`Shop ${storeName} here 👉 ${url}`)}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked — the URL is still selectable in the field.
    }
  }

  function downloadQr() {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${storeName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-qr.png`
    a.click()
  }

  return (
    <Card className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Share your store</p>
          <p className="text-xs text-ink/50 mt-0.5">
            {isPublished ? 'Post this link on WhatsApp, Instagram and anywhere customers find you.' : 'Publish your store first — until then this link shows "not available".'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={displayUrl}
          aria-label="Store link"
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 rounded-lg border border-sand-200 bg-sand-100 px-3 py-2 text-sm font-mono text-ink/80 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            {copied ? <IconCheck className="w-4 h-4" stroke={2} /> : <IconCopy className="w-4 h-4" stroke={1.75} />}
            <span aria-live="polite">{copied ? 'Copied' : 'Copy link'}</span>
          </button>
          <a
            href={whatsappShare}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium bg-sand-100 text-ink hover:bg-sand-200 border border-sand-200 transition-colors"
          >
            WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            aria-expanded={showQr}
            aria-label={showQr ? 'Hide QR code' : 'Show QR code'}
            className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium bg-sand-100 text-ink hover:bg-sand-200 border border-sand-200 transition-colors"
          >
            <IconQrcode className="w-4 h-4" stroke={1.75} />
          </button>
        </div>
      </div>

      {showQr && (
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
          {/* White plate so the code scans in dark mode too */}
          <div ref={qrRef} className="rounded-lg bg-white p-3">
            <QRCodeCanvas value={url} size={168} marginSize={1} />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm text-ink/70 mb-2">Print it on packaging, flyers or your shop counter.</p>
            <button
              type="button"
              onClick={downloadQr}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium bg-sand-100 text-ink hover:bg-sand-200 border border-sand-200 transition-colors"
            >
              <IconDownload className="w-4 h-4" stroke={1.75} />
              Download PNG
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
