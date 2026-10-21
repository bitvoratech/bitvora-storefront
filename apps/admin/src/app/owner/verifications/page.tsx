import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { createAdminClient } from '../../../lib/supabase/admin'
import { requireStaffPage } from '../../../lib/auth/require-owner'
import { ReviewButtons } from './ReviewButtons'

type Row = {
  id: string
  full_name: string | null
  business_name: string | null
  phone: string | null
  nin: string | null
  cac_number: string | null
  verification_status: string
  verification_submitted_at: string | null
  verification_reviewed_at: string | null
  verification_note: string | null
}

const COLUMNS = 'id, full_name, business_name, phone, nin, cac_number, verification_status, verification_submitted_at, verification_reviewed_at, verification_note'

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

function Detail({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-ink/40">{label}</p>
      <p className={`text-sm break-all ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  )
}

export default async function OwnerVerificationsPage() {
  await requireStaffPage()
  const admin = createAdminClient()

  const [{ data: pending }, { data: reviewed }] = await Promise.all([
    admin.from('merchants').select(COLUMNS).eq('verification_status', 'pending').not('nin', 'is', null).not('cac_number', 'is', null).not('phone_verified_at', 'is', null).order('verification_submitted_at', { ascending: true }),
    admin.from('merchants').select(COLUMNS).in('verification_status', ['verified', 'failed']).not('verification_reviewed_at', 'is', null).order('verification_reviewed_at', { ascending: false }).limit(20),
  ])
  const queue = (pending ?? []) as Row[]
  const recent = (reviewed ?? []) as Row[]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-sm font-semibold mb-1">Waiting for review ({queue.length})</h2>
        <p className="text-xs text-ink/50 mb-3">
          Check each NIN with NIMC and each CAC number on the CAC public search, then approve or reject. Phone numbers are already OTP-verified.
        </p>
        {queue.length === 0 ? (
          <Card><p className="text-sm text-ink/50 text-center py-4">Nothing to review.</p></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {queue.map((m) => (
              <Card key={m.id}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <Link href={`/owner/merchants/${m.id}`} className="font-medium hover:text-indigo-600">{m.full_name || 'Unnamed'}</Link>
                    <p className="text-xs text-ink/50">Submitted {formatDate(m.verification_submitted_at)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Detail label="Business name" value={m.business_name} />
                  <Detail label="Phone" value={m.phone} mono />
                  <Detail label="NIN" value={m.nin} mono />
                  <Detail label="CAC number" value={m.cac_number} mono />
                </div>
                <ReviewButtons merchantId={m.id} compact />
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-sm font-semibold mb-3">Recently reviewed</h2>
        <Card className="p-0 overflow-hidden">
          {recent.length === 0 && <p className="text-sm text-ink/50 px-4 py-6 text-center">No reviews yet.</p>}
          {recent.map((m, i) => (
            <div key={m.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${i !== recent.length - 1 ? 'border-b border-sand-200' : ''}`}>
              <div className="min-w-0">
                <Link href={`/owner/merchants/${m.id}`} className="text-sm font-medium hover:text-indigo-600">{m.full_name || 'Unnamed'}</Link>
                <p className="text-xs text-ink/50 truncate">
                  {m.business_name || '—'} · {formatDate(m.verification_reviewed_at)}
                  {m.verification_status === 'failed' && m.verification_note ? ` · ${m.verification_note}` : ''}
                </p>
              </div>
              <span className={`shrink-0 text-[11px] font-medium rounded-full px-2 py-0.5 ${m.verification_status === 'verified' ? 'bg-palm-50 text-palm-600' : 'bg-pepper-50 text-pepper-600'}`}>
                {m.verification_status === 'verified' ? 'Approved' : 'Rejected'}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
