'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconBell, IconChecks } from '@tabler/icons-react'
import { createClient } from '../lib/supabase/client'
import { timeAgo } from '../lib/time-ago'

type Notification = {
  id: string
  kind: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

const LIMIT = 30

// The bell in the console header. Rows are written by database triggers
// (see the notifications migration); this only reads them and marks them read.
export function NotificationBell({ merchantId }: { merchantId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    supabase
      .from('notifications')
      .select('id, kind, title, body, link, read_at, created_at')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(LIMIT)
      .then(({ data }) => {
        if (data) setItems(data)
      })
  }, [supabase, merchantId])

  useEffect(() => {
    load()
    // Live updates when Realtime is on for the table; refetching on focus
    // covers it when it isn't.
    const channel = supabase
      .channel(`notifications:${merchantId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `merchant_id=eq.${merchantId}` },
        (payload) => setItems((prev) => [payload.new as Notification, ...prev].slice(0, LIMIT))
      )
      .subscribe()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      supabase.removeChannel(channel)
    }
  }, [supabase, merchantId, load])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const unread = items.filter((n) => !n.read_at).length

  async function markRead(ids: string[]) {
    if (!ids.length) return
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read_at: n.read_at ?? now } : n)))
    await supabase.from('notifications').update({ read_at: now }).in('id', ids)
  }

  function openItem(n: Notification) {
    if (!n.read_at) markRead([n.id])
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative p-2 rounded-lg text-ink/70 hover:text-ink hover:bg-sand-100 dark:hover:bg-sand-200 transition-colors"
      >
        <IconBell className="w-5 h-5" stroke={1.75} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold leading-4 text-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-sand-200 bg-white dark:bg-sand-100 shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-sand-200">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead(items.filter((n) => !n.read_at).map((n) => n.id))}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <IconChecks className="w-3.5 h-3.5" stroke={1.75} />
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink/50">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-[min(28rem,70vh)] overflow-y-auto divide-y divide-sand-200">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-sand-100 dark:hover:bg-sand-200 transition-colors ${
                      n.read_at ? 'opacity-60' : ''
                    }`}
                  >
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read_at ? 'bg-transparent' : 'bg-indigo-600'}`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{n.title}</span>
                      {n.body && <span className="block text-xs text-ink/60 mt-0.5">{n.body}</span>}
                      <span className="block text-[11px] text-ink/40 mt-1">{timeAgo(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
