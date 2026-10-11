'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IconMenu2, IconX } from '@tabler/icons-react'
import { ADMIN_URL } from '../lib/plans'

const LINKS = [
  { href: '/pricing', label: 'Pricing' },
]

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="border-b border-sand-200 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 shrink">
          <Link href="/" className="flex items-center gap-2 min-w-0 shrink">
          <Image
            src="/brand/icon-light-bg.svg"
            alt="Bitvora Storefront"
            width={120}
            height={30}
            className="h-6 sm:h-7 w-auto shrink-0"
          />
          <span className="font-display font-semibold text-sm sm:text-base truncate">
            Bitvora <span className="hidden sm:inline">Storefront</span>
          </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-soft hover:text-ink transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`${ADMIN_URL}/signup`}
            className="shrink-0 rounded-lg bg-indigo-600 hidden md:inline-block text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            Get started
          </a>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="md:hidden shrink-0 p-2 -mr-2 text-ink/70 hover:text-ink"
          >
            {open ? <IconX className="w-5 h-5" stroke={1.75} /> : <IconMenu2 className="w-5 h-5" stroke={1.75} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-sand-200 bg-paper px-4 sm:px-6 py-3 flex flex-col gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 text-sm font-medium text-ink hover:bg-sand-100 transition-colors"
            >
              {link.label}
            </Link>
          ))}

          <a
            href={`${ADMIN_URL}/signup`}
            className="shrink-0 rounded-lg bg-indigo-600 text-center text-white text-sm font-medium px-3  py-2 hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            Get started
          </a>

        </nav>
      )}
    </header>
  )
}