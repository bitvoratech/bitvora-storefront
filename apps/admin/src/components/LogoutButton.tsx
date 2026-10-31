'use client'

import { useRouter } from 'next/navigation'
import { IconLogout } from '@tabler/icons-react'
import { createClient } from '../lib/supabase/client'

export function LogoutButton({ collapsed }: { collapsed?: boolean }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-indigo-100/70 hover:bg-white/5 hover:text-white transition-colors ${
        collapsed ? 'justify-center' : ''
      }`}
    >
      <IconLogout className="w-4 h-4 shrink-0" />
      {!collapsed && 'Log out'}
    </button>
  )
}