import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card } from '@bitvora/ui/src/Card'
import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { PLAN_NAMES, PLAN_PRODUCT_LIMIT, PLAN_STORE_LIMIT, formatNaira, hasActivePlan, parseInterval, parsePlan, planDiscountPercent, planLabel, planPrice } from '../../lib/plans'
import { CheckoutForm, ManageButton, type TransferOption } from './CheckoutForm'
import { UpgradeForm, type UpgradeChoice } from './UpgradeForm'
import { canOpenStore } from '../../lib/merchant-identity'
import { canPayByTransfer, canUpgradeByTransfer, cardPaymentsEnabled, higherPlans, isFirstPayment, transferAccount, transferReference, upgradePrice } from '../../lib/bank-transfer'

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

const TRANSFER_STATUS: Record<string, { text: string; tone: string }> = {
  pending: { text: 'Checking', tone: 'bg-marigold-50 text-marigold-500' },
  confirmed: { text: 'Paid', tone: 'bg-palm-50 text-palm-600' },
  rejected: { text: 'Not received', tone: 'bg-pepper-50 text-pepper-600' },
}

type TransferRow = {
  id: string
  kind: string | null
  plan: string
  plan_interval: string
  amount: number
  status: string
  review_note: string | null
  created_at: string
}

const DAY_MS = 24 * 60 * 60 * 1000

// Outside the component: reading the clock isn't allowed during render.
function periodTimeLeft(periodEnd: string | null, now = Date.now()) {
  if (!periodEnd) return { daysLeft: null, pastEnd: false }
  const ms = Date.parse(periodEnd) - now
  return { daysLeft: Math.max(0, Math.ceil(ms / DAY_MS)), pastEnd: ms < 0 }
}

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Used against a plan limit; null limit = unlimited.
function Meter({ label, used, limit, hint }: { label: string; used: number; limit: number | null; hint?: string }) {
  const share = limit ? Math.min(used / limit, 1) : 0
  const tone = !limit ? 'bg-palm-600' : share >= 1 ? 'bg-pepper-600' : share >= 0.8 ? 'bg-marigold-500' : 'bg-indigo-600'
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-ink/70">{label}</span>
        <span className="shrink-0 font-medium tabular-nums">
          {used}
          <span className="text-ink/40"> / {limit ?? 'unlimited'}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-sand-100 overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: limit ? `${Math.max(share * 100, used ? 4 : 0)}%` : '100%' }} />
      </div>
      {hint && <p className="mt-1 text-xs text-ink/40">{hint}</p>}
    </div>
  )
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

  // Transfers are server-only rows; read this merchant's recent ones.
  const { data: transferRows } = merchant
    ? await createAdminClient()
        .from('plan_transfers')
        .select('id, kind, plan, plan_interval, amount, status, review_note, created_at')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })
        .limit(12)
    : { data: null }
  const history = (transferRows ?? []) as TransferRow[]
  const lastTransfer = history[0] ?? null
  const pendingTransfer = lastTransfer?.status === 'pending' ? lastTransfer : null
  const rejectedTransfer = lastTransfer?.status === 'rejected' ? lastTransfer : null

  // Usage against the plan's limits (stores, and products in each store).
  const { data: stores } = active && merchant
    ? await supabase.from('stores').select('id, name, products(count)').eq('merchant_id', merchant.id).order('created_at')
    : { data: null }
  const usage = (stores ?? []).map((st) => ({
    id: st.id as string,
    name: st.name as string,
    products: (st.products as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
  }))

  const transfer: TransferOption | null = account && merchant && canPayByTransfer(merchant) && !pendingTransfer
    ? {
        ...account,
        reference: transferReference(merchant.id),
        discountPercent: isFirstPayment(merchant) ? planDiscountPercent() : 0,
      }
    : null
  // A transfer-paid plan doesn't renew on its own.
  const paidByTransfer = status === 'active' && !merchant?.paystack_subscription_code
  const plan = parsePlan(merchant?.plan)
  const interval = parseInterval(merchant?.plan_interval) ?? 'monthly'
  const periodEnd = merchant?.current_period_end ?? null
  const { daysLeft, pastEnd } = periodTimeLeft(periodEnd)

  const upgrades: UpgradeChoice[] = account && plan && merchant && !pendingTransfer && canUpgradeByTransfer(merchant)
    ? higherPlans(plan)
        .map((to) => ({ plan: to, amount: upgradePrice(plan, to, interval, periodEnd) }))
        .filter((c) => c.amount > 0)
    : []

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-display font-semibold mb-1">Plan &amp; billing</h1>
      <p className="text-sm text-ink/50 mb-6">
        {card ? 'Your Bitvora Stores plan is paid securely through Paystack.' : 'Pay for your Bitvora Stores plan by bank transfer.'}
      </p>

      {note && <p className={`text-sm rounded-lg px-3 py-2 mb-4 ${note.tone}`}>{note.text}</p>}
      {rejectedTransfer && (!active || rejectedTransfer.kind === 'upgrade') && (
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
            You told us you sent {formatNaira(pendingTransfer.amount)} for {pendingTransfer.kind === 'upgrade' ? `an upgrade to ${planLabel(pendingTransfer.plan)}` : planLabel(pendingTransfer.plan, pendingTransfer.plan_interval)} on{' '}
            {formatDate(pendingTransfer.created_at)}. We’ll switch your plan on as soon as it arrives, usually within a few hours.
            {account ? ` It goes to ${account.accountName}, ${account.accountNumber} (${account.bankName}).` : ''}
          </p>
        </Card>
      )}

      {active ? (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink/40 font-semibold">Current plan</p>
                <p className="text-xl font-display font-semibold">{plan ? PLAN_NAMES[plan] : '—'}</p>
                <p className="text-sm text-ink/50">
                  {status === 'comped'
                    ? STATUS_TEXT.comped
                    : plan
                      ? `${formatNaira(planPrice(plan, interval))} / ${interval === 'annual' ? 'year' : 'month'}, ${paidByTransfer ? 'paid by bank transfer' : 'paid by card'}`
                      : null}
                </p>
              </div>
              {status !== 'comped' && (
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-ink/40 font-semibold">
                    {paidByTransfer ? 'Paid until' : STATUS_TEXT[status] ?? 'Paid until'}
                  </p>
                  <p className="font-medium">{formatDate(periodEnd)}</p>
                  {daysLeft !== null && (
                    <p className={`text-xs ${pastEnd || daysLeft <= 10 ? 'text-marigold-500' : 'text-ink/40'}`}>
                      {pastEnd ? 'Ended. Your store stays open for a few days while you renew.' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                    </p>
                  )}
                </div>
              )}
            </div>

            {plan && (
              <div className="border-t border-sand-200 mt-4 pt-4 space-y-4">
                <Meter label="Stores" used={usage.length} limit={PLAN_STORE_LIMIT[plan]} />
                {usage.map((st) => (
                  <Meter
                    key={st.id}
                    label={`Products in ${st.name}`}
                    used={st.products}
                    limit={PLAN_PRODUCT_LIMIT[plan]}
                    hint={PLAN_PRODUCT_LIMIT[plan] !== null && st.products >= PLAN_PRODUCT_LIMIT[plan]! ? 'This store is full. Upgrade to add more products.' : undefined}
                  />
                ))}
              </div>
            )}

            {merchant?.paystack_subscription_code && status !== 'comped' && (
              <div className="border-t border-sand-200 mt-4 pt-4 space-y-3">
                <ManageButton />
                <p className="text-xs text-ink/40">
                  To change plans, email <a href="mailto:help@bitvoratech.com" className="text-indigo-600">help@bitvoratech.com</a>.
                </p>
              </div>
            )}
          </Card>

          {upgrades.length > 0 && transfer === null && account && merchant && (
            <Card>
              <p className="font-medium">Upgrade your plan</p>
              <p className="text-sm text-ink/50 mt-1 mb-4">Get more stores and products today. Pay only for the days left until {formatDate(periodEnd)}.</p>
              <UpgradeForm
                choices={upgrades}
                paidUntil={shortDate(periodEnd!)}
                transfer={{ ...account, reference: transferReference(merchant.id), discountPercent: 0 }}
              />
            </Card>
          )}

          {transfer && (
            <Card>
              <p className="font-medium">{pastEnd ? 'Renew your plan' : 'Your plan ends soon'}</p>
              <p className="text-sm text-ink/50 mt-1 mb-4">
                {pastEnd
                  ? 'Pay for the next period to keep your stores running.'
                  : 'Pay for the next period now and it starts when this one ends. You can switch plans for the next period here too.'}
              </p>
              <CheckoutForm plan={plan} interval={interval} discountPercent={0} card={false} transfer={transfer} />
            </Card>
          )}

          {upgrades.length > 0 && transfer && (
            <p className="text-xs text-ink/40 px-1">
              Want more right now? Renew on a bigger plan above and it switches on as soon as we confirm your transfer.
            </p>
          )}
        </div>
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

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-sm font-semibold mb-3">Payment history</h2>
          <Card className="p-0 overflow-hidden">
            {history.map((t, i) => {
              const badge = TRANSFER_STATUS[t.status] ?? TRANSFER_STATUS.pending
              return (
                <div key={t.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${i !== history.length - 1 ? 'border-b border-sand-200' : ''}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {t.kind === 'upgrade' ? `Upgrade to ${planLabel(t.plan)}` : planLabel(t.plan, t.plan_interval)}
                    </p>
                    <p className="text-xs text-ink/50 truncate">
                      Bank transfer · {shortDate(t.created_at)}
                      {t.status === 'rejected' && t.review_note ? ` · ${t.review_note}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium tabular-nums">{formatNaira(t.amount)}</p>
                    <span className={`inline-block mt-0.5 text-[11px] font-medium rounded-full px-2 py-0.5 ${badge.tone}`}>{badge.text}</span>
                  </div>
                </div>
              )
            })}
          </Card>
          {merchant?.paystack_subscription_code && (
            <p className="text-xs text-ink/40 mt-2">Card payments and receipts are in the emails Paystack sends you.</p>
          )}
        </div>
      )}
    </div>
  )
}
