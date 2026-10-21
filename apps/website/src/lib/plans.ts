// Single source of truth for plan names, prices and limits on the marketing
// site. Kept dependency-free so it can move into a shared workspace package
// once the admin app needs the same limits for enforcement.

export type PlanId = 'starter' | 'growth' | 'pro'
export type Interval = 'monthly' | 'annual'
/** string = a limit/label, true = included, false = locked on this plan */
export type Cell = string | boolean

export type Plan = {
  id: PlanId
  name: string
  tagline: string
  monthly: number // ₦ per month, billed monthly
  featured?: boolean
  limits: { label: string; value: string }[]
  features: string[]
  locked: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For sellers just getting their store online.',
    monthly: 5000,
    limits: [
      { label: 'Store', value: '1' },
      { label: 'Products per store', value: '30' },
    ],
    features: [
      'Brand color, logo & hero section',
      'WhatsApp order button on every product',
      'Bank transfer & pay-on-delivery checkout',
      'Order management dashboard',
      'Email support',
    ],
    locked: ['Collections, banners & about section', 'Font pairing & layout options'],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'For stores ready to look and sell like a real brand.',
    monthly: 12000,
    featured: true,
    limits: [
      { label: 'Stores', value: '2' },
      { label: 'Products per store', value: '150' },
    ],
    features: [
      'Everything in Starter',
      'Full homepage customization — collections, banners & about',
      'Font pairing, heading size & grid layout',
      'Show, hide & reorder homepage sections',
      'Priority WhatsApp support',
    ],
    locked: ['Unlimited products'],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For established merchants with serious order volume.',
    monthly: 25000,
    limits: [
      { label: 'Stores', value: '5' },
      { label: 'Products per store', value: 'Unlimited' },
    ],
    features: [
      'Everything in Growth',
      'Priority order & payment support',
      'Early access to new features',
      'Dedicated onboarding call',
    ],
    locked: [],
  },
]

// 2 months free on annual (pay for 10, get 12).
export const ANNUAL_MONTHS = 10

export const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://bitvora-storefront.vercel.app'

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`
}

/** Effective per-month price for an interval. */
export function monthlyPrice(plan: Plan, interval: Interval) {
  return interval === 'annual' ? Math.round((plan.monthly * ANNUAL_MONTHS) / 12) : plan.monthly
}

/** Signup link that carries the chosen plan through to the admin app. */
export function planSignupUrl(id: PlanId, interval: Interval) {
  return `${ADMIN_URL}/signup?plan=${id}&interval=${interval}`
}

// Rows for the full comparison table. Order of `values` = PLANS order.
export const COMPARISON: { group: string; rows: { label: string; values: [Cell, Cell, Cell] }[] }[] = [
  {
    group: 'Limits',
    rows: [
      { label: 'Stores', values: ['1', '2', '5'] },
      { label: 'Products per store', values: ['30', '150', 'Unlimited'] },
      { label: 'Orders', values: ['Unlimited', 'Unlimited', 'Unlimited'] },
    ],
  },
  {
    group: 'Storefront customization',
    rows: [
      { label: 'Brand color', values: [true, true, true] },
      { label: 'Store logo', values: [true, true, true] },
      { label: 'Homepage hero', values: [true, true, true] },
      { label: 'Social links & WhatsApp number', values: [true, true, true] },
      { label: 'About section', values: [false, true, true] },
      { label: 'Featured collections', values: [false, true, true] },
      { label: 'Closing banner', values: [false, true, true] },
      { label: 'Font pairing & heading size', values: [false, true, true] },
      { label: 'Product grid density', values: [false, true, true] },
      { label: 'Show, hide & reorder sections', values: [false, true, true] },
    ],
  },
  {
    group: 'Selling',
    rows: [
      { label: 'WhatsApp order button', values: [true, true, true] },
      { label: 'Bank transfer checkout', values: [true, true, true] },
      { label: 'Pay on delivery', values: [true, true, true] },
      { label: 'Order management', values: [true, true, true] },
    ],
  },
  {
    group: 'Support',
    rows: [
      { label: 'Email support', values: [true, true, true] },
      { label: 'Priority WhatsApp support', values: [false, true, true] },
      { label: 'Priority order & payment support', values: [false, false, true] },
      { label: 'Early access to new features', values: [false, false, true] },
      { label: 'Dedicated onboarding call', values: [false, false, true] },
    ],
  },
]