import Link from 'next/link'
import { Card } from '@bitvora/ui/src/Card'
import { createAdminClient } from '../../../lib/supabase/admin'
import { requireStaffPage } from '../../../lib/auth/require-owner'
import { formatNaira, planLabel } from '../../../lib/plans'
import { transferAccount } from '../../../lib/bank-transfer'
import { TransferButtons } from './TransferButtons'

type Row = {
  id: string
  merchant_id: string
  kind: string
  plan: string
  plan_interval: string
  amount: number
  reference: string
  sender_name: string | null
  status: string
  review_note: string | null
  reviewed_at: string | null
  created_at: string
  merchants: { full_name: string | null; business_name: string | null; phone: string | null } | null
}

const COLUMNS = 'id, merchant_id, kind, plan, plan_interval, amount, reference, sender_name, status, review_note, reviewed_at, created_at, merchants!plan_transfers_merchant_id_fkey(full_name, business_name, phone)'

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

export default async function OwnerPlanPaymentsPage() {
  await requireStaffPage()
  const admin = createAdminClient()
  const account = transferAccount()

  const [{ data: pending }, { data: reviewed }] = await Promise.all([
    admin.from('plan_transfers').select(COLUMNS).eq('status', 'pending').order('created_at', { ascending: true }),
    admin.from('plan_transfers').select(COLUMNS).neq('status', 'pending').order('reviewed_at', { ascending: false }).limit(20),
  ])
  const queue = (pending ?? []) as unknown as Row[]
  const recent = (reviewed ?? []) as unknown as Row[]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-sm font-semibold mb-1">Bank transfers to check ({queue.length})</h2>
        <p className="text-xs text-ink/50 mb-3">
          {account
            ? `Look for each one in ${account.accountName}, ${account.accountNumber} (${account.bankName}) by reference and amount. Confirming switches the merchant’s plan on for the paid period; an upgrade switches the plan and keeps their paid-until date.`
            : 'Bank transfer is switched off (no PLAN_TRANSFER_* settings), so merchants can’t send new ones. You can still handle any listed here.'}
        </p>
        {queue.length === 0 ? (
          <Card><p className="text-sm text-ink/50 text-center py-4">Nothing to check.</p></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {queue.map((t) => (
              <Card key={t.id}>
                <div className="mb-3">
                  <Link href={`/owner/merchants/${t.merchant_id}`} className="font-medium hover:text-indigo-600">
                    {t.merchants?.full_name || 'Unnamed'}
                  </Link>
                  <p className="text-xs text-ink/50">Sent {formatDate(t.created_at)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Detail label="Amount" value={formatNaira(t.amount)} />
                  <Detail label="Reference" value={t.reference} mono />
                  <Detail label="Paid from" value={t.sender_name} />
                  <Detail label={t.kind === 'upgrade' ? 'Upgrade to' : 'Plan'} value={planLabel(t.plan, t.plan_interval)} />
                  <Detail label="Business" value={t.merchants?.business_name ?? null} />
                  <Detail label="Phone" value={t.merchants?.phone ?? null} mono />
                </div>
                <TransferButtons transferId={t.id} />
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-sm font-semibold mb-3">Recently handled</h2>
        <Card className="p-0 overflow-hidden">
          {recent.length === 0 && <p className="text-sm text-ink/50 px-4 py-6 text-center">None yet.</p>}
          {recent.map((t, i) => (
            <div key={t.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${i !== recent.length - 1 ? 'border-b border-sand-200' : ''}`}>
              <div className="min-w-0">
                <Link href={`/owner/merchants/${t.merchant_id}`} className="text-sm font-medium hover:text-indigo-600">{t.merchants?.full_name || 'Unnamed'}</Link>
                <p className="text-xs text-ink/50 truncate">
                  {formatNaira(t.amount)} · {t.kind === 'upgrade' ? 'upgrade to ' : ''}{planLabel(t.plan, t.plan_interval)} · {formatDate(t.reviewed_at)}
                  {t.status === 'rejected' && t.review_note ? ` · ${t.review_note}` : ''}
                </p>
              </div>
              <span className={`shrink-0 text-[11px] font-medium rounded-full px-2 py-0.5 ${t.status === 'confirmed' ? 'bg-palm-50 text-palm-600' : 'bg-pepper-50 text-pepper-600'}`}>
                {t.status === 'confirmed' ? 'Confirmed' : 'Rejected'}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
