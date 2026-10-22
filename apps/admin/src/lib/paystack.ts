// Paystack, for merchants paying for their Bitvora Stores plan. Shoppers on
// storefronts still pay merchants by bank transfer; nothing here touches that.
// Server-only: it uses PAYSTACK_SECRET_KEY.

import { createHmac, timingSafeEqual } from 'node:crypto'
import { PLAN_NAMES, planPrice, type PlanId, type PlanInterval } from './plans'

const API = 'https://api.paystack.co'

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error('Missing PAYSTACK_SECRET_KEY')
  return key
}

async function paystack<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? 'GET',
    headers: { Authorization: `Bearer ${secretKey()}`, 'Content-Type': 'application/json' },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null
  if (!res.ok || !json?.status) {
    throw new Error(`Paystack ${path} failed: ${res.status} ${json?.message ?? ''}`.trim())
  }
  return json.data as T
}

export const PAYSTACK_INTERVAL: Record<PlanInterval, 'monthly' | 'annually'> = {
  monthly: 'monthly',
  annual: 'annually',
}

/** The Paystack plan name for one of our plans, e.g. "Bitvora Stores Growth (annual)". */
export function paystackPlanName(plan: PlanId, interval: PlanInterval) {
  return `Bitvora Stores ${PLAN_NAMES[plan]} (${interval})`
}

type PaystackPlan = { plan_code: string; name: string; amount: number; interval: string; currency: string }

/**
 * The Paystack plan code for a plan and interval. Plans are created in Paystack
 * on first use, so nothing has to be set up by hand; a price change in
 * plans.ts creates a fresh plan rather than repricing existing subscribers.
 */
export async function getPlanCode(plan: PlanId, interval: PlanInterval): Promise<string> {
  const name = paystackPlanName(plan, interval)
  const amount = planPrice(plan, interval) * 100 // kobo
  const existing = await paystack<PaystackPlan[]>('/plan?perPage=100')
  const match = existing.find(
    (p) => p.name === name && p.amount === amount && p.interval === PAYSTACK_INTERVAL[interval] && p.currency === 'NGN',
  )
  if (match) return match.plan_code

  const created = await paystack<PaystackPlan>('/plan', {
    method: 'POST',
    body: { name, amount, interval: PAYSTACK_INTERVAL[interval], currency: 'NGN' },
  })
  return created.plan_code
}

/** Creates (or, for a known email, returns) the Paystack customer for a merchant. */
export async function upsertCustomer(input: { email: string; merchantId: string; fullName?: string | null; phone?: string | null }) {
  const [first, ...rest] = (input.fullName ?? '').trim().split(/\s+/)
  const customer = await paystack<{ customer_code: string }>('/customer', {
    method: 'POST',
    body: {
      email: input.email,
      first_name: first || undefined,
      last_name: rest.join(' ') || undefined,
      phone: input.phone || undefined,
      metadata: { merchant_id: input.merchantId },
    },
  })
  return customer.customer_code
}

/** Starts a card payment that subscribes the merchant to the plan once paid. */
export async function initializeSubscription(input: {
  email: string
  merchantId: string
  plan: PlanId
  interval: PlanInterval
  callbackUrl: string
}) {
  const planCode = await getPlanCode(input.plan, input.interval)
  const data = await paystack<{ authorization_url: string; reference: string }>('/transaction/initialize', {
    method: 'POST',
    body: {
      email: input.email,
      // Paystack charges the plan's amount; this must still be sent.
      amount: planPrice(input.plan, input.interval) * 100,
      plan: planCode,
      // Renewals charge the saved card, so the first payment has to be a card.
      channels: ['card'],
      callback_url: input.callbackUrl,
      metadata: { merchant_id: input.merchantId, plan: input.plan, interval: input.interval },
    },
  })
  return data
}

export type PaystackTransaction = {
  reference: string
  status: string
  amount: number
  currency: string
  paid_at: string | null
  customer: { customer_code: string; email: string }
  metadata: { merchant_id?: string; plan?: string; interval?: string } | string | null
  plan?: unknown
}

export function verifyTransaction(reference: string) {
  return paystack<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`)
}

/** A one-time link where the merchant can update their card or cancel. */
export async function subscriptionManageLink(subscriptionCode: string) {
  const data = await paystack<{ link: string }>(`/subscription/${encodeURIComponent(subscriptionCode)}/manage/link`)
  return data.link
}

/** Checks a webhook's x-paystack-signature (HMAC-SHA512 of the raw body). */
export function isValidSignature(rawBody: string, signature: string | null, key = process.env.PAYSTACK_SECRET_KEY) {
  if (!signature || !key) return false
  const expected = createHmac('sha512', key).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** When a period paid for at `from` runs out. */
export function periodEnd(from: Date, interval: PlanInterval): Date {
  const end = new Date(from)
  if (interval === 'annual') end.setUTCFullYear(end.getUTCFullYear() + 1)
  else end.setUTCMonth(end.getUTCMonth() + 1)
  return end
}

/** Paystack sends metadata as an object or, from some clients, a JSON string. */
export function readMetadata(meta: PaystackTransaction['metadata']): { merchant_id?: string; plan?: string; interval?: string } {
  if (!meta) return {}
  if (typeof meta === 'string') {
    try {
      const parsed = JSON.parse(meta)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return meta
}
