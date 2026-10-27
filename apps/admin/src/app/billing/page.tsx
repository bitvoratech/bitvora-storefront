import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card } from '@bitvora/ui/src/Card'
import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { formatNaira, hasActivePlan, parseInterval, parsePlan, planDiscountPercent, planLabel } from '../../lib/plans'
import { CheckoutForm, ManageButton, type TransferOption } from './CheckoutForm'
import { canOpenStore } from '../../lib/merchant-identity'
import { canPayByTransfer, cardPaymentsEnabled, isFirstPayment, transferAccount, transferReference } from '../../lib/bank-transfer'

const PAYMENT_NOTE: Record<string, { text: string; tone: string }> = {
  success: { text: 'Payment received. Your plan is active.', tone: 'bg-palm-50 text-palm-600' },
  pending: { text: 'We’re confirming your payment with Paystack. Refresh this page in a minute.', tone: 'bg-marigold-50 text-marigold-500' },
  failed: { text: 'That payment didn’t go through. You haven’t been charged for a plan.', tone: 'bg-pepper-50 text-pepper-600' },
}

const STATUS_TEXT: Record<string, string> = {
  active: 'Renews',
  non_renewing: 'Cancelled, ends',
  past_due: 'Renewal failed. Paystack will retry; access ends',
  comped: 'Free access granted by Bitvora',
}

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, is_owner, is_admin, verification_status, phone_verified_at, plan, plan_interval, subscription_status, current_period_end, paystack_subscription_code')
    .eq('user_id', user.id)
    .single()

  if (merchant?.is_owner || merchant?.is_admin) redirect('/owner')

  const note = PAYMENT_NOTE[(await searchParams).payment ?? '']
  const active = hasActivePlan(merchant)
  const phoneVerified = canOpenStore(merchant)
  const status = merchant?.subscription_status ?? ''
  const card = cardPaymentsEnabled()
  const account = transferAccount()

  // Transfers are server-only rows; read this merchant's latest one.
  const { data: lastTransfer } = account && merchant
    ? await createAdminClient()
        .from('plan_transfers')
        .select('plan, plan_interval, amount, status, review_note, created_at')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }
  const pendingTransfer = lastTransfer?.status === 'pending' ? lastTransfer : null
  const rejectedTransfer = lastTransfer?.status === 'rejected' ? lastTransfer : null

  const transfer: TransferOption | null = account && merchant && canPayByTransfer(merchant) && !pendingTransfer
    ? {
        ...account,
        reference: transferReference(merchant.id),
        discountPercent: isFirstPayment(merchant) ? planDiscountPercent() : 0,
      }
    : null
  // A transfer-paid plan doesn't renew on its own.
  const paidByTransfer = status === 'active' && !merchant?.paystack_subscription_code

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-display font-semibold mb-1">Plan &amp; billing</h1>
      <p className="text-sm text-ink/50 mb-6">
        {card ? 'Your Bitvora Stores plan is paid securely through Paystack.' : 'Pay for your Bitvora Stores plan by bank transfer.'}
      </p>

      {note && <p className={`text-sm rounded-lg px-3 py-2 mb-4 ${note.tone}`}>{note.text}</p>}
      {rejectedTransfer && !active && (
        <p className="text-sm rounded-lg px-3 py-2 mb-4 bg-pepper-50 text-pepper-600">
          We couldn’t confirm your transfer of {formatNaira(rejectedTransfer.amount)}
          {rejectedTransfer.review_note ? `: ${rejectedTransfer.review_note}` : '.'} Email{' '}
          <a href="mailto:help@bitvoratech.com" className="underline">help@bitvoratech.com</a> if you think this is a mistake.
        </p>
      )}
      {pendingTransfer && (
        <Card className="mb-4">
          <p className="font-medium">We’re checking your transfer</p>
          <p className="text-sm text-ink/50 mt-1">
            You told us you sent {formatNaira(pendingTransfer.amount)} for {planLabel(pendingTransfer.plan, pendingTransfer.plan_interval)} on{' '}
            {formatDate(pendingTransfer.created_at)}. We’ll switch your plan on as soon as it arrives, usually within a few hours.
            {account ? ` It goes to ${account.accountName}, ${account.accountNumber} (${account.bankName}).` : ''}
          </p>
        </Card>
      )}

      {active ? (
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink/40 font-semibold">Current plan</p>
            <p className="text-lg font-medium">{planLabel(merchant?.plan, merchant?.plan_interval) ?? '—'}</p>
            <p className="text-sm text-ink/50">
              {status === 'comped'
                ? STATUS_TEXT.comped
                : `${paidByTransfer ? 'Paid until' : STATUS_TEXT[status] ?? 'Paid until'} ${formatDate(merchant?.current_period_end ?? null)}`}
            </p>
          </div>
          {transfer && (
            <div className="border-t border-sand-200 pt-4">
              <p className="text-sm text-ink/60 mb-4">Your plan ends soon. Pay for the next period now and it starts when this one ends.</p>
              <CheckoutForm
                plan={parsePlan(merchant?.plan)}
                interval={parseInterval(merchant?.plan_interval) ?? 'monthly'}
                discountPercent={0}
                card={false}
                transfer={transfer}
              />
            </div>
          )}
          {merchant?.paystack_subscription_code && status !== 'comped' && <ManageButton />}
          <p className="text-xs text-ink/40">
            To change plans, email <a href="mailto:help@bitvoratech.com" className="text-indigo-600">help@bitvoratech.com</a>.
          </p>
        </Card>
      ) : !phoneVerified ? (
        <Card>
          <p className="font-medium">Pay once your phone is verified</p>
          <p className="text-sm text-ink/50 mt-1">
            {planLabel(merchant?.plan, merchant?.plan_interval)
              ? `You picked ${planLabel(merchant?.plan, merchant?.plan_interval)}. `
              : ''}
            Confirm your phone number first, then you can pay for your plan and open your store.
          </p>
          <Link href="/verify" className="inline-block mt-4 text-sm text-indigo-600 font-medium">Verify my phone</Link>
        </Card>
      ) : pendingTransfer ? null : !card && !transfer ? (
        <Card>
          <p className="text-sm text-ink/60">
            Plan payments are paused for a moment. Email <a href="mailto:help@bitvoratech.com" className="text-indigo-600">help@bitvoratech.com</a> and we’ll help you get started.
          </p>
        </Card>
      ) : (
        <Card>
          {status ? (
            <p className="text-sm text-ink/60 mb-4">Your plan has ended. Pick a plan to keep creating and running stores.</p>
          ) : (
            <p className="text-sm text-ink/60 mb-4">Pay for your plan to create your first store.</p>
          )}
          <CheckoutForm
            plan={parsePlan(merchant?.plan)}
            interval={parseInterval(merchant?.plan_interval) ?? 'monthly'}
            discountPercent={planDiscountPercent()}
            card={card}
            transfer={transfer}
          />
        </Card>
      )}
    </div>
  )
}
