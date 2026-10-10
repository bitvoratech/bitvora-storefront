'use client'

import { useId, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { IconSearch, IconX } from '@tabler/icons-react'

// Store-wide search. Follows the usual e-commerce search guidance: an explicit
// submit button next to the field, and the query stays visible after
// searching (it lives in the URL, so results are also shareable).
export function StoreSearch({ slug, storeName }: { slug: string; storeName: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get('q') ?? ''
  const [value, setValue] = useState(current)
  const [lastCurrent, setLastCurrent] = useState(current)
  // The header renders one search bar for mobile and one for desktop.
  const inputId = useId()

  // Keep the field in sync when the URL changes (back button, "clear search").
  if (current !== lastCurrent) {
    setLastCurrent(current)
    setValue(current)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    const next = new URLSearchParams(params.toString())
    if (q) next.set('q', q)
    else next.delete('q')
    const qs = next.toString()
    router.push(`/${slug}${qs ? `?${qs}` : ''}#products`)
  }

  function clear() {
    setValue('')
    const next = new URLSearchParams(params.toString())
    next.delete('q')
    const qs = next.toString()
    router.push(`/${slug}${qs ? `?${qs}` : ''}`)
  }

  return (
    <form role="search" onSubmit={submit} className="relative flex w-full items-center">
      <label htmlFor={inputId} className="sr-only">Search {storeName}</label>
      <IconSearch className="pointer-events-none absolute left-3 w-4 h-4 text-[#525252]" stroke={2} />
      <input
        id={inputId}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        maxLength={60}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Search ${storeName}`}
        className="w-full rounded-full border border-[#cfcfcf] bg-white pl-9 pr-24 py-2.5 text-sm text-[#171717] placeholder:text-[#737373] shadow-sm outline-none hover:border-[#a3a3a3] focus-visible:border-[#171717] focus-visible:ring-2 focus-visible:ring-[#171717]/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-[4.25rem] p-1 text-[#737373] hover:text-[#171717]"
        >
          <IconX className="w-4 h-4" stroke={1.75} />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-1 rounded-full px-3.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        Search
      </button>
    </form>
  )
}
