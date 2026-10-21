import Link from 'next/link'
import { requireStaffPage } from '../../lib/auth/require-owner'

const TABS = [
  { href: '/owner', label: 'Overview' },
  { href: '/owner/merchants', label: 'Merchants' },
  { href: '/owner/verifications', label: 'Verifications' },
  { href: '/owner/stores', label: 'Stores' },
  { href: '/owner/orders', label: 'Orders' },
  { href: '/owner/revenue', label: 'Revenue' },
]

const OWNER_TABS = [{ href: '/owner/admins', label: 'Admins' }]

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireStaffPage()
  const tabs = role === 'owner' ? [...TABS, ...OWNER_TABS] : TABS

  return (
    <div className="max-w-7xl mx-0 lg:mx-auto rounded-lg p-3 sm:p-4 border border-sand-200">
      <h1 className="text-xl sm:text-2xl font-display font-semibold mb-1">{role === 'owner' ? 'Owner console' : 'Admin console'}</h1>
      <p className="text-ink/50 text-sm mb-6">Bitvora Storefront — all merchants and stores.</p>

      <div
        className="flex gap-1 mb-6 border-b border-sand-200 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((tab) => (
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