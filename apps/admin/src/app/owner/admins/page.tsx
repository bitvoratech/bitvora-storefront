import { Card } from '@bitvora/ui/src/Card'
import { createAdminClient } from '../../../lib/supabase/admin'
import { requireOwnerPage } from '../../../lib/auth/require-owner'
import { AddAdminForm } from './AddAdminForm'
import { RemoveAdminButton } from './RemoveAdminButton'

export default async function OwnerAdminsPage() {
  await requireOwnerPage()
  const admin = createAdminClient()

  const { data: rows } = await admin
    .from('merchants')
    .select('id, user_id, full_name, created_at')
    .eq('is_admin', true)
    .order('created_at', { ascending: true })

  // Emails live in auth.users, not merchants.
  const admins = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data } = await admin.auth.admin.getUserById(row.user_id)
      return { ...row, email: data.user?.email ?? null }
    })
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-sm font-semibold mb-1">Add an admin</h2>
        <p className="text-xs text-ink/50 mb-3">
          Admins can review verifications and manage merchants, stores and orders. They can&apos;t add or remove admins, and they don&apos;t get a store.
        </p>
        <Card>
          <AddAdminForm />
        </Card>
      </div>

      <div>
        <h2 className="font-display text-sm font-semibold mb-3">Admins ({admins.length})</h2>
        <Card className="p-0 overflow-hidden">
          {admins.length === 0 && <p className="text-sm text-ink/50 px-4 py-8 text-center">No admins yet.</p>}
          {admins.map((a, i) => (
            <div key={a.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${i !== admins.length - 1 ? 'border-b border-sand-200' : ''}`}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{a.full_name || a.email || 'Admin'}</p>
                <p className="text-xs text-ink/50 truncate">{a.email ?? '—'}</p>
              </div>
              <RemoveAdminButton merchantId={a.id} name={a.full_name || a.email || 'this admin'} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
