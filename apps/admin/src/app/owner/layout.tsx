import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'

const TABS = [
  { href: '/owner', label: 'Overview' },
  { href: '/owner/merchants', label: 'Merchants' },
  { href: '/owner/verifications', label: 'Verifications' },
  { href: '/owner/stores', label: 'Stores' },
  { href: '/owner/orders', label: 'Orders' },
  { href: '/owner/revenue', label: 'Revenue' },
]

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant } = await supabase.from('merchants').select('is_owner').eq('user_id', user.id).single()
  if (!merchant?.is_owner) redirect('/')

  return (
    <div className="max-w-7xl mx-0 lg:mx-auto rounded-lg p-3 sm:p-4 border border-sand-200">
      <h1 className="text-xl sm:text-2xl font-display font-semibold mb-1">Platform</h1>
      <p className="text-ink/50 text-sm mb-6">Bitvora Storefront — all merchants and stores.</p>

      <div
        className="flex gap-1 mb-6 border-b border-sand-200 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="shrink-0 whitespace-nowrap px-3 py-2 text-sm text-ink/60 hover:text-indigo-600 border-b-2 border-transparent hover:border-indigo-600 -mb-px transition-colors"
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  )
}