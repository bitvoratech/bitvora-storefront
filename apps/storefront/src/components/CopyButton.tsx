'use client'

import { useState } from 'react'
import { IconCheck, IconCopy } from '@tabler/icons-react'

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked (insecure context / permissions); the value is still visible to copy by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : label}
      title={label}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#525252] hover:bg-[#f5f5f5] hover:text-[#171717] transition-colors"
    >
      {copied ? <IconCheck className="w-3.5 h-3.5 text-green-600" stroke={2} /> : <IconCopy className="w-3.5 h-3.5" stroke={1.75} />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}
