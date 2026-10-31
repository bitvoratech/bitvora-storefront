'use client'

import { useActionState, useState } from 'react'
import { Button } from '@bitvora/ui/src/Button'
import { IconAlertTriangle } from '@tabler/icons-react'
import { submitUpgrade } from './actions'
import { PLAN_NAMES, PLAN_SUMMARY, formatNaira, type PlanId } from '../../lib/plans'
import type { TransferOption } from './CheckoutForm'

export type UpgradeChoice = { plan: PlanId; amount: number }

// Moving up a plan mid-period by bank transfer. Amounts are worked out on the
// server for the days left; the action works them out again before saving.
export function UpgradeForm({ choices, transfer, paidUntil }: { choices: UpgradeChoice[]; transfer: TransferOption; paidUntil: string }) {
  const [state, action, pending] = useActionState(submitUpgrade, undefined)
  const [plan, setPlan] = useState<PlanId>(choices[0].plan)
  const amount = choices.find((c) => c.plan === plan)?.amount ?? 0

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div role="alert" className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2">
          <IconAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}
      <div className="grid gap-2">
        {choices.map((c) => (
          <label
            key={c.plan}
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm cursor-pointer transition-colors ${plan === c.plan ? 'border-indigo-600 bg-indigo-50/40' : 'border-sand-200'}`}
          >
            <input type="radio" name="plan" value={c.plan} checked={plan === c.plan} onChange={() => setPlan(c.plan)} className="sr-only" />
            <span className="min-w-0">
              <span className="block font-medium">{PLAN_NAMES[c.plan]}</span>
              <span className="block text-xs text-ink/50">{PLAN_SUMMARY[c.plan]}</span>
            </span>
            <span className="text-right">
              <span className="font-semibold">{formatNaira(c.amount)}</span>
              <span className="block text-xs text-ink/40">until {paidUntil}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="rounded-xl bg-sand-100 px-4 py-3 grid grid-cols-2 gap-3 text-sm">
        <Detail label="Amount" value={formatNaira(amount)} />
        <Detail label="Reference" value={transfer.reference} mono />
        <Detail label="Bank" value={transfer.bankName} />
        <Detail label="Account number" value={transfer.accountNumber} mono />
        <div className="col-span-2"><Detail label="Account name" value={transfer.accountName} /></div>
      </div>
      <p className="text-xs text-ink/50">
        You only pay the difference for the days left on your plan. Send exactly {formatNaira(amount)} with {transfer.reference} in the description, then tell us below. Your plan switches to {PLAN_NAMES[plan]} once the money arrives, and your renewal date stays the same.
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
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Saving...' : `I’ve sent ${formatNaira(amount)}`}
      </Button>
    </form>
  )
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-ink/40">{label}</p>
      <p className={`font-medium break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
