import { requireStaffPage } from '../../lib/auth/require-owner'

// Navigation lives in the sidebar; a second row of tabs here used to list
// different pages from it and never showed which one was open.
export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireStaffPage()

  return (
    <div className="max-w-7xl mx-0 lg:mx-auto">
      <h1 className="text-xl sm:text-2xl font-display font-semibold mb-1">{role === 'owner' ? 'Owner console' : 'Admin console'}</h1>
      <p className="text-ink/50 text-sm mb-6">Bitvora Stores — all merchants and stores.</p>

      {children}
    </div>
  )
}
