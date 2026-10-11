'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { IconMenu2 } from '@tabler/icons-react'

export function Shell({
  children,
  userEmail,
  topBar,
  isOwner,
  merchantName,
  avatarUrl,
}: {
  children: React.ReactNode
  userEmail: string | null
  topBar?: React.ReactNode
  isOwner?: boolean
  merchantName?: string | null
  avatarUrl?: string | null
}) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userEmail={userEmail}
        merchantName={merchantName}
        avatarUrl={avatarUrl}
        isOwner={isOwner}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden flex items-center gap-3 border-b border-sand-200 bg-white dark:bg-sand-100 px-4 py-3 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="p-2 -ml-2 text-ink/70">
            <IconMenu2 className="w-5 h-5" stroke={1.75} />
          </button>
          <Link href="/" className="flex items-center gap-2 min-w-0" aria-label="Dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/icon-light-bg.svg" alt="" className="h-6 w-6 shrink-0 dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/icon-dark-bg.svg" alt="" className="h-6 w-6 shrink-0 hidden dark:block" />
            <span className="font-display font-semibold text-sm truncate">Bitvora</span>
          </Link>
        </div>

        {topBar}

        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  )
}