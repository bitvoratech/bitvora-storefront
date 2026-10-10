import Link from 'next/link'
import { createClient } from '../lib/supabase/server'

export async function TopBar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: merchant } = user
    ? await supabase.from('merchants').select('full_name').eq('user_id', user.id).single()
    : { data: null }

  const initial = merchant?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="hidden lg:flex items-center justify-end gap-3 border-b border-sand-200 bg-white dark:bg-sand-100 px-8 py-3">
      <Link
        href="/profile"
        className="flex items-center gap-2 text-sm text-ink/70 hover:text-ink transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-medium flex items-center justify-center">
          {initial}
        </span>
        {merchant?.full_name || user?.email}
      </Link>
    </div>
  )
}