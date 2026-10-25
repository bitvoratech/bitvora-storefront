'use client'

import { useState } from 'react'
import { ANNUAL_MONTHS, PLAN_IDS, PLAN_NAMES, PLAN_SUMMARY, discountedPrice, firstPaymentDiscount, formatNaira, planPrice, type PlanId, type PlanInterval } from '../lib/plans'

// Plan and billing-period choice. As radios inside a form (name="plan" and
// name="interval"), or, with `hrefFor`, as links that carry the choice on.
export function PlanOptions({
  defaultPlan,
  defaultInterval = 'monthly',
  hrefFor,
  discountPercent = 0,
}: {
  discountPercent?: number
  defaultPlan?: PlanId | null
  defaultInterval?: PlanInterval
  hrefFor?: (plan: PlanId, interval: PlanInterval) => string
}) {
  const [interval, setInterval] = useState<PlanInterval>(defaultInterval)
  const [plan, setPlan] = useState<PlanId>(defaultPlan ?? 'growth')
  const off = firstPaymentDiscount(interval, discountPercent)

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-lg bg-sand-100 p-1 text-sm">
        {(['monthly', 'annual'] as const).map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={interval === i}
            onClick={() => setInterval(i)}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${interval === i ? 'bg-paper text-ink shadow-sm' : 'text-ink/50'}`}
          >
            {i === 'monthly' ? 'Monthly' : `Annual · ${12 - ANNUAL_MONTHS} months free`}
          </button>
        ))}
      </div>
      {!hrefFor && <input type="hidden" name="interval" value={interval} />}

      <div className="grid gap-2">
        {PLAN_IDS.map((id) => {
          const price = (
            <span className="text-right">
              {off > 0 && (
                <span className="text-xs text-ink/40 line-through mr-1.5">{formatNaira(planPrice(id, interval))}</span>
              )}
              <span className="font-semibold">{formatNaira(discountedPrice(id, interval, off))}</span>
              <span className="text-xs text-ink/40"> / {off > 0 ? 'first month' : interval === 'annual' ? 'year' : 'month'}</span>
            </span>
          )
          const body = (
            <>
              <span className="min-w-0">
                <span className="block font-medium">{PLAN_NAMES[id]}</span>
                <span className="block text-xs text-ink/50">{PLAN_SUMMARY[id]}</span>
              </span>
              {price}
            </>
          )
          const box = 'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition-colors'
          if (hrefFor) {
            return (
              <a key={id} href={hrefFor(id, interval)} className={`${box} border-sand-200 hover:border-indigo-600`}>
                {body}
              </a>
            )
          }
          return (
            <label key={id} className={`${box} cursor-pointer ${plan === id ? 'border-indigo-600 bg-indigo-50/40' : 'border-sand-200'}`}>
              <input type="radio" name="plan" value={id} checked={plan === id} onChange={() => setPlan(id)} className="sr-only" />
              {body}
            </label>
          )
        })}
      </div>
    </div>
  )
}
