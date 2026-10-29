'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { IconMenu2 } from '@tabler/icons-react'
import { NotificationBell } from './NotificationBell'

// Full-screen pages with no dashboard chrome: signing in, and the steps a
// merchant goes through before they have a dashboard to use.
const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify', '/suspended']

export function Shell({
  children,
  userEmail,
  topBar,
  merchantId = null,
  staffRole,
  merchantName,
  avatarUrl,
  canCreateStore = false,
  storeLimitMessage = null,
  sidebarCollapsed = false,
}: {
  children: React.ReactNode
  userEmail: string | null
  topBar?: React.ReactNode
  merchantId?: string | null
  staffRole?: 'owner' | 'admin' | null
  merchantName?: string | null
  avatarUrl?: string | null
  canCreateStore?: boolean
  storeLimitMessage?: string | null
  sidebarCollapsed?: boolean
}) {
  const pathname = usePathname()
  const isAuthPage = AUTH_PAGES.includes(pathname)
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
        staffRole={staffRole}
        canCreateStore={canCreateStore}
        storeLimitMessage={storeLimitMessage}
        initialCollapsed={sidebarCollapsed}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* One header for both sizes: the menu button and logo are mobile
            only, the notification bell sits top right on every screen. */}
        <div className={`${merchantId ? 'flex' : 'flex lg:hidden'} items-center gap-3 border-b border-sand-200 bg-white dark:bg-sand-100 px-4 lg:px-8 py-3 lg:py-2 sticky top-0 z-20`}>
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="lg:hidden p-2 -ml-2 text-ink/70">
            <IconMenu2 className="w-5 h-5" stroke={1.75} />
          </button>
          <Link href="/" className="lg:hidden flex items-center gap-2 min-w-0" aria-label="Dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/icon-light-bg.svg" alt="" className="h-6 w-6 shrink-0 dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/icon-dark-bg.svg" alt="" className="h-6 w-6 shrink-0 hidden dark:block" />
            <span className="font-display font-semibold text-sm truncate">Bitvora</span>
          </Link>
          {merchantId && (
            <div className="ml-auto">
              <NotificationBell merchantId={merchantId} />
            </div>
          )}
        </div>

        {topBar}

        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  )
}