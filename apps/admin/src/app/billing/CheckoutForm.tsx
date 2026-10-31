'use client'

import { useActionState, useState } from 'react'
import { Button } from '@bitvora/ui/src/Button'
import { IconAlertTriangle } from '@tabler/icons-react'
import { PlanOptions } from '../../components/PlanOptions'
import { openManageLink, startCheckout, submitTransfer } from './actions'
import { discountedPrice, firstPaymentDiscount, formatNaira, type PlanId, type PlanInterval } from '../../lib/plans'

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null
  return (
    <div role="alert" className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2">
      <IconAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      {error}
    </div>
  )
}

export type TransferOption = {
  bankName: string
  accountNumber: string
  accountName: string
  reference: string
  discountPercent: number
}

export function CheckoutForm({
  plan,
  interval,
  discountPercent,
  card = true,
  transfer = null,
}: {
  plan: PlanId | null
  interval: PlanInterval
  discountPercent: number
  card?: boolean
  transfer?: TransferOption | null
}) {
  const [state, action, pending] = useActionState(startCheckout, undefined)
  const [transferState, transferAction, transferPending] = useActionState(submitTransfer, undefined)
  const [choice, setChoice] = useState<{ plan: PlanId; interval: PlanInterval }>({ plan: plan ?? 'growth', interval })
  const shownDiscount = card ? discountPercent : transfer?.discountPercent ?? 0
  const transferAmount = transfer
    ? discountedPrice(choice.plan, choice.interval, firstPaymentDiscount(choice.interval, transfer.discountPercent))
    : 0

  return (
    <form action={action} className="space-y-4">
      <ErrorNote error={state?.error ?? transferState?.error} />
      {shownDiscount > 0 && (
        <p className="text-sm rounded-lg px-3 py-2 bg-palm-50 text-palm-600">
          Beta offer: {shownDiscount}% off your first month on any monthly plan. After that it renews at the normal price.
        </p>
      )}
      <PlanOptions
        defaultPlan={plan}
        defaultInterval={interval}
        discountPercent={shownDiscount}
        onChange={(p, i) => setChoice({ plan: p, interval: i })}
      />
      {card && (
        <>
          <Button type="submit" disabled={pending || transferPending} className="w-full">
            {pending ? 'Opening Paystack...' : 'Pay with Paystack'}
          </Button>
          <p className="text-xs text-ink/40 text-center">
            Paid by debit card. Your plan renews automatically and you can cancel any time.
          </p>
        </>
      )}
      {transfer && (
        <div className={`space-y-3 ${card ? 'border-t border-sand-200 pt-4' : ''}`}>
          <p className="text-sm font-medium">{card ? 'Or pay by bank transfer' : 'Pay by bank transfer'}</p>
          <div className="rounded-xl bg-sand-100 px-4 py-3 grid grid-cols-2 gap-3 text-sm">
            <TransferDetail label="Amount" value={formatNaira(transferAmount)} />
            <TransferDetail label="Reference" value={transfer.reference} mono />
            <TransferDetail label="Bank" value={transfer.bankName} />
            <TransferDetail label="Account number" value={transfer.accountNumber} mono />
            <div className="col-span-2"><TransferDetail label="Account name" value={transfer.accountName} /></div>
          </div>
          <p className="text-xs text-ink/50">
            Send exactly {formatNaira(transferAmount)} and put {transfer.reference} in the transfer description. Then tell us below. We switch your plan on once the money arrives, usually within a few hours.
          </p>
          <label className="block text-sm">
            <span className="block text-ink/60 mb-1">Name on the account you paid from</span>
            <input
              name="sender_name"
              maxLength={120}
              autoComplete="name"
              className="w-full rounded-lg border border-sand-200 bg-white dark:bg-sand-100 px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-indigo-600"
            />
          </label>
          <Button type="submit" formAction={transferAction} variant={card ? 'secondary' : undefined} disabled={pending || transferPending} className="w-full">
            {transferPending ? 'Saving...' : 'I’ve sent the transfer'}
          </Button>
        </div>
      )}
    </form>
  )
}

function TransferDetail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-ink/40">{label}</p>
      <p className={`font-medium break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

export function ManageButton() {
  const [state, action, pending] = useActionState(openManageLink, undefined)
  return (
    <form action={action} className="space-y-3">
      <ErrorNote error={state?.error} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? 'Opening Paystack...' : 'Update card or cancel'}
      </Button>
    </form>
  )
}
