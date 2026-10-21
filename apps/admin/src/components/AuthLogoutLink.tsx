'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'

// "Log out" for the full-screen pages that have no sidebar.
export function AuthLogoutLink({ className = '' }: { className?: string }) {
  const router = useRouter()

  return (
    <button
      type="button"
      className={`text-sm text-ink/50 hover:text-ink ${className}`}
      onClick={async () => {
        await createClient().auth.signOut()
        router.push('/login')
        router.refresh()
      }}
    >
      Log out
    </button>
  )
}
