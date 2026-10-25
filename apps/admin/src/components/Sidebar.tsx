'use client'
/* eslint-disable @next/next/no-img-element -- small previews of merchant-uploaded Cloudinary images; next/image has no remote patterns configured in the admin */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Home, Plus, Grid, PackageBox, Storefront, Receipt, User, Users } from 'switch-icons'
import { IconChevronRight, IconChevronDown, IconPalette, IconHelpCircle, IconLogout, IconTruckDelivery, IconShieldCheck, IconUserShield, IconChartBar, IconCreditCard, IconMessage2 } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import { ThemeToggle } from './ThemeToggle'
import { SIDEBAR_COOKIE } from '../lib/sidebar'

// Beta feedback form (e.g. a Tally link). The link is hidden when unset.
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL
const HELP_URL = `https://wa.me/2349112449545?text=${encodeURIComponent('Hi Bitvora, I need help with my store.')}`

type NavItem = { href: string; icon: React.ComponentType<{ className?: string }>; label: string }

function SimpleLink({ item, active, collapsed, onClick }: { item: NavItem; active: boolean; collapsed: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        collapsed ? 'justify-center' : ''
      } ${active ? 'bg-white/10 text-white font-medium' : 'text-indigo-100/70 hover:bg-white/5 hover:text-white'}`}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {!collapsed && item.label}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-white dark:bg-sand-100 px-2.5 py-1.5 text-xs font-medium text-indigo-950 dark:text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
          {item.label}
        </span>
      )}
    </Link>
  )
}

function GroupNav({
  label,
  icon: Icon,
  items,
  pathname,
  collapsed,
  onClick,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
  pathname: string
  collapsed: boolean
  onClick?: () => void
}) {
  const isAnyActive = items.some((i) => pathname === i.href)
  const [open, setOpen] = useState(true)
  const [flyoutOpen, setFlyoutOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const [flyoutPos, setFlyoutPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  function handleEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) setFlyoutPos({ top: rect.top, left: rect.right + 12 })
    setFlyoutOpen(true)
  }
  function handleLeave() {
    closeTimer.current = setTimeout(() => setFlyoutOpen(false), 120)
  }

  if (collapsed) {
    return (
      <div ref={triggerRef} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        <div
          className={`flex items-center justify-center rounded-lg px-3 py-2 text-sm cursor-default ${
            isAnyActive ? 'bg-white/10 text-white' : 'text-indigo-100/70'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
        </div>
        {/*
          Rendered in a portal with fixed positioning: the <nav> has
          overflow-x-hidden (so it can scroll vertically), which clips any
          absolutely-positioned child that extends past the collapsed
          sidebar's width — that's what made these options invisible.
        */}
        {flyoutOpen &&
          createPortal(
            <div
              style={{ position: 'fixed', top: flyoutPos.top, left: flyoutPos.left }}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
              className="w-52 rounded-xl bg-white dark:bg-sand-100 border border-transparent dark:border-sand-200 shadow-2xl p-2 z-[60]"
            >
              <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/40 truncate">{label}</p>
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClick}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    pathname === item.href ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-ink/70 hover:bg-sand-100 dark:hover:bg-sand-200'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>,
            document.body
          )}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
          isAnyActive ? 'text-white font-medium' : 'text-indigo-100/70 hover:text-white'
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <IconChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} stroke={1.75} />
      </button>
      {open && (
        <div className="mt-0.5 ml-3.5 pl-3 border-l border-white/10 space-y-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClick}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                pathname === item.href ? 'bg-white/10 text-white font-medium' : 'text-indigo-100/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({
  userEmail,
  merchantName,
  avatarUrl,
  staffRole,
  canCreateStore = false,
  initialCollapsed = false,
  open,
  onClose,
}: {
  userEmail: string | null
  merchantName?: string | null
  avatarUrl?: string | null
  staffRole?: 'owner' | 'admin' | null
  canCreateStore?: boolean
  initialCollapsed?: boolean
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const storeMatch = pathname.match(/^\/stores\/([^/]+)/)
  const storeId = storeMatch && storeMatch[1] !== 'new' ? storeMatch[1] : null
  // Read from a cookie on the server, so a collapsed sidebar doesn't flash open on load.
  const [collapsed, setCollapsed] = useState(initialCollapsed)

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    document.cookie = `${SIDEBAR_COOKIE}=${next ? '1' : '0'}; path=/; max-age=31536000; samesite=lax`
  }
  const [storeName, setStoreName] = useState<{ id: string; name: string } | null>(null)

  // The sidebar only knows the store id (from the URL), so look up its name.
  useEffect(() => {
    if (!storeId) return
    let cancelled = false
    createClient()
      .from('stores')
      .select('name')
      .eq('id', storeId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data?.name) setStoreName({ id: storeId, name: data.name })
      })
    return () => {
      cancelled = true
    }
  }, [storeId])

  const currentStoreName = storeName && storeName.id === storeId ? storeName.name : null

  const isActive = (href: string) => pathname === href
  const initial = merchantName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || '?'

  const storeSubLinks: NavItem[] = storeId
    ? [
        { href: `/stores/${storeId}`, icon: Grid, label: 'Overview' },
        { href: `/stores/${storeId}/products`, icon: PackageBox, label: 'Products' },
        { href: `/stores/${storeId}/orders`, icon: Receipt, label: 'Orders' },
        { href: `/stores/${storeId}/delivery`, icon: IconTruckDelivery, label: 'Delivery & payments' },
        { href: `/stores/${storeId}/customize`, icon: IconPalette, label: 'Customize' },
      ]
    : []

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}

      <aside
        className={`shrink-0 flex flex-col h-screen fixed lg:sticky top-0 left-0 z-40 transition-all duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-[84px]' : 'lg:w-64'} w-64`}
        style={{ backgroundColor: 'var(--color-indigo-900)', overflow: 'visible' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
          />
        </div>

        {/* Collapse toggle — floats on the edge */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="hidden lg:flex absolute -right-3 top-8 z-50 w-6 h-6 rounded-full bg-white dark:bg-sand-100 shadow-md items-center justify-center text-indigo-900 dark:text-ink hover:bg-sand-100 dark:hover:bg-sand-200 transition-colors"
        >
          <IconChevronRight className={`w-3.5 h-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`} stroke={2} />
        </button>

        {/* Profile card */}
        <div className={`relative p-4 border-b border-white/10 ${collapsed ? 'lg:flex lg:justify-center lg:px-3' : ''}`}>
          <div className={`flex items-center gap-2.5 ${collapsed ? 'lg:justify-center' : ''}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-marigold-500 text-indigo-950 flex items-center justify-center font-semibold text-sm shrink-0">
                {initial}
              </div>
            )}
            <div className={collapsed ? 'lg:hidden' : ''}>
              <p className="text-sm font-medium text-white leading-tight truncate max-w-[150px]">
                {merchantName || 'Your account'}
              </p>
              <p className="text-xs text-indigo-300/60 leading-tight truncate max-w-[150px]">
                {userEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Scrolls on short screens, without showing a scrollbar. */}
        <nav className="relative flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className={`px-3 pt-1 pb-1 text-[10.5px] uppercase tracking-wider text-indigo-300/50 font-semibold ${collapsed ? 'lg:hidden' : ''}`}>
            Main
          </p>
          {staffRole ? (
            <>
              {/* The owner and admins run the platform; they don't have stores. */}
              <SimpleLink item={{ href: '/owner', icon: Home, label: 'Dashboard' }} active={isActive('/owner')} collapsed={collapsed} onClick={onClose} />
              <SimpleLink item={{ href: '/owner/verifications', icon: IconShieldCheck, label: 'Verifications' }} active={isActive('/owner/verifications')} collapsed={collapsed} onClick={onClose} />
              <SimpleLink item={{ href: '/owner/merchants', icon: Users, label: 'Merchants' }} active={pathname.startsWith('/owner/merchants')} collapsed={collapsed} onClick={onClose} />
              <SimpleLink item={{ href: '/owner/stores', icon: Storefront, label: 'Stores' }} active={isActive('/owner/stores')} collapsed={collapsed} onClick={onClose} />
              <SimpleLink item={{ href: '/owner/orders', icon: Receipt, label: 'Orders' }} active={isActive('/owner/orders')} collapsed={collapsed} onClick={onClose} />
              <SimpleLink item={{ href: '/owner/revenue', icon: IconChartBar, label: 'Revenue' }} active={isActive('/owner/revenue')} collapsed={collapsed} onClick={onClose} />
              {staffRole === 'owner' && (
                <SimpleLink item={{ href: '/owner/admins', icon: IconUserShield, label: 'Admins' }} active={isActive('/owner/admins')} collapsed={collapsed} onClick={onClose} />
              )}
            </>
          ) : (
            <>
              <SimpleLink item={{ href: '/', icon: Home, label: 'Dashboard' }} active={isActive('/')} collapsed={collapsed} onClick={onClose} />
              {/* Unverified merchants can't create a store yet; the dashboard shows why. */}
              {canCreateStore && (
                <SimpleLink item={{ href: '/stores/new', icon: Plus, label: 'New store' }} active={isActive('/stores/new')} collapsed={collapsed} onClick={onClose} />
              )}
            </>
          )}

          {storeId && (
            <div className="pt-2">
              <GroupNav label={currentStoreName ?? 'This store'} icon={Storefront} items={storeSubLinks} pathname={pathname} collapsed={collapsed} onClick={onClose} />
            </div>
          )}

          <p className={`px-3 pt-4 pb-1 text-[10.5px] uppercase tracking-wider text-indigo-300/50 font-semibold ${collapsed ? 'lg:hidden' : ''}`}>
            Settings
          </p>
          <SimpleLink item={{ href: '/profile', icon: User, label: 'Profile' }} active={isActive('/profile')} collapsed={collapsed} onClick={onClose} />
          {!staffRole && (
            <SimpleLink item={{ href: '/billing', icon: IconCreditCard, label: 'Plan & billing' }} active={isActive('/billing')} collapsed={collapsed} onClick={onClose} />
          )}
        </nav>

        <div className="relative p-3 border-t border-white/10 space-y-0.5">
          <ThemeToggle collapsed={collapsed} />
          {FEEDBACK_URL && (
            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={collapsed ? 'Send feedback' : undefined}
              className={`group relative w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-indigo-100/70 hover:bg-white/5 hover:text-white transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <IconMessage2 className="w-4 h-4 shrink-0" stroke={1.75} />
              {!collapsed && 'Send feedback'}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-white dark:bg-sand-100 px-2.5 py-1.5 text-xs font-medium text-indigo-950 dark:text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
                  Send feedback
                </span>
              )}
            </a>
          )}
          {/* Support runs on WhatsApp, same number as the marketing site. */}
          <a
            href={HELP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={collapsed ? 'Help on WhatsApp' : undefined}
            className={`group relative w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-indigo-100/70 hover:bg-white/5 hover:text-white transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <IconHelpCircle className="w-4 h-4 shrink-0" stroke={1.75} />
            {!collapsed && 'Help'}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-white dark:bg-sand-100 px-2.5 py-1.5 text-xs font-medium text-indigo-950 dark:text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
                Help
              </span>
            )}
          </a>
          <button
            onClick={handleLogout}
            aria-label={collapsed ? 'Log out' : undefined}
            className={`group relative w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-pepper-600/90 hover:bg-pepper-600/10 hover:text-pepper-600 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <IconLogout className="w-4 h-4 shrink-0" stroke={1.75} />
            {!collapsed && 'Log out'}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-white dark:bg-sand-100 px-2.5 py-1.5 text-xs font-medium text-indigo-950 dark:text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
                Log out
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}