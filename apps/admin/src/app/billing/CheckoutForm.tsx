'use client'

import { useActionState } from 'react'
import { Button } from '@bitvora/ui/src/Button'
import { AlertTriangle } from 'switch-icons'
import { PlanOptions } from '../../components/PlanOptions'
import { openManageLink, startCheckout } from './actions'
import type { PlanId, PlanInterval } from '../../lib/plans'

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null
  return (
    <div role="alert" className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      {error}
    </div>
  )
}

export function CheckoutForm({ plan, interval, discountPercent }: { plan: PlanId | null; interval: PlanInterval; discountPercent: number }) {
  const [state, action, pending] = useActionState(startCheckout, undefined)
  return (
    <form action={action} className="space-y-4">
      <ErrorNote error={state?.error} />
      {discountPercent > 0 && (
        <p className="text-sm rounded-lg px-3 py-2 bg-palm-50 text-palm-600">
          Beta price: {discountPercent}% off any plan, and your renewals stay at this price.
        </p>
      )}
      <PlanOptions defaultPlan={plan} defaultInterval={interval} discountPercent={discountPercent} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Opening Paystack...' : 'Pay with Paystack'}
      </Button>
      <p className="text-xs text-ink/40 text-center">
        Paid by debit card. Your plan renews automatically and you can cancel any time.
      </p>
    </form>
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
