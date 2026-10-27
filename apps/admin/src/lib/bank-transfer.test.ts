import { describe, expect, it } from 'vitest'
import { canPayByTransfer, canUpgradeByTransfer, cardPaymentsEnabled, higherPlans, isFirstPayment, transferAccount, transferPeriodStart, transferReference, upgradePrice } from './bank-transfer'

const DAY = 24 * 60 * 60 * 1000
const now = Date.parse('2026-11-01T12:00:00Z')
const inDays = (d: number) => new Date(now + d * DAY).toISOString()

describe('transferAccount', () => {
  it('needs all three details', () => {
    const env = { PLAN_TRANSFER_BANK_NAME: 'Moniepoint', PLAN_TRANSFER_ACCOUNT_NUMBER: ' 0123456789 ', PLAN_TRANSFER_ACCOUNT_NAME: 'Bitvoratech' }
    expect(transferAccount(env)).toEqual({ bankName: 'Moniepoint', accountNumber: '0123456789', accountName: 'Bitvoratech' })
    expect(transferAccount({ ...env, PLAN_TRANSFER_ACCOUNT_NAME: '' })).toBeNull()
    expect(transferAccount({})).toBeNull()
  })
})

describe('cardPaymentsEnabled', () => {
  it('is on with a Paystack key unless switched off', () => {
    expect(cardPaymentsEnabled({ PAYSTACK_SECRET_KEY: 'sk' })).toBe(true)
    expect(cardPaymentsEnabled({ PAYSTACK_SECRET_KEY: 'sk', PLAN_CARD_PAYMENTS: 'OFF' })).toBe(false)
    expect(cardPaymentsEnabled({})).toBe(false)
  })
})

describe('transferReference', () => {
  it('is short and stable per merchant', () => {
    expect(transferReference('3f2a9c1e-77b0-4d1a-9e2f-000000000000')).toBe('BVS-3F2A9C1E')
  })
})

describe('canPayByTransfer', () => {
  it('allows a merchant without a paid plan', () => {
    expect(canPayByTransfer(null, now)).toBe(true)
    expect(canPayByTransfer({ subscription_status: 'active', current_period_end: inDays(-5) }, now)).toBe(true)
  })
  it('allows renewing a transfer plan only near its end', () => {
    expect(canPayByTransfer({ subscription_status: 'active', current_period_end: inDays(20) }, now)).toBe(false)
    expect(canPayByTransfer({ subscription_status: 'active', current_period_end: inDays(5) }, now)).toBe(true)
  })
  it('leaves card subscriptions and comped plans alone', () => {
    expect(canPayByTransfer({ subscription_status: 'active', current_period_end: inDays(5), paystack_subscription_code: 'SUB_1' }, now)).toBe(false)
    expect(canPayByTransfer({ subscription_status: 'comped' }, now)).toBe(false)
  })
})

describe('isFirstPayment', () => {
  it('is true only before any paid period', () => {
    expect(isFirstPayment({ subscription_status: null })).toBe(true)
    expect(isFirstPayment({ subscription_status: 'active', current_period_end: inDays(-40) })).toBe(false)
    expect(isFirstPayment({ subscription_status: 'comped' })).toBe(false)
  })
})

describe('transferPeriodStart', () => {
  it('extends an active period and restarts a lapsed one', () => {
    const at = new Date(now)
    expect(transferPeriodStart({ subscription_status: 'active', current_period_end: inDays(5) }, at).toISOString()).toBe(inDays(5))
    expect(transferPeriodStart({ subscription_status: 'active', current_period_end: inDays(-10) }, at)).toEqual(at)
    expect(transferPeriodStart(null, at)).toEqual(at)
  })
})

describe('higherPlans', () => {
  it('lists only plans above the current one', () => {
    expect(higherPlans('starter')).toEqual(['growth', 'pro'])
    expect(higherPlans('pro')).toEqual([])
    expect(higherPlans(null)).toEqual([])
  })
})

describe('canUpgradeByTransfer', () => {
  const base = { subscription_status: 'active', plan: 'starter', current_period_end: inDays(20) }
  it('allows a transfer plan with time left and a bigger plan available', () => {
    expect(canUpgradeByTransfer(base, now)).toBe(true)
    expect(canUpgradeByTransfer({ ...base, plan: 'pro' }, now)).toBe(false)
    expect(canUpgradeByTransfer({ ...base, current_period_end: inDays(0.5) }, now)).toBe(false)
  })
  it('leaves card subscriptions and comped plans alone', () => {
    expect(canUpgradeByTransfer({ ...base, paystack_subscription_code: 'SUB_1' }, now)).toBe(false)
    expect(canUpgradeByTransfer({ ...base, subscription_status: 'comped' }, now)).toBe(false)
  })
})

describe('upgradePrice', () => {
  it('charges the difference for the days left, rounded up to ₦100', () => {
    // Starter → Growth is ₦7,000 a month; 15 of 30 days left.
    expect(upgradePrice('starter', 'growth', 'monthly', inDays(15), now)).toBe(3500)
    expect(upgradePrice('starter', 'pro', 'monthly', inDays(1), now)).toBe(700)
    // Annual: ₦70,000 difference a year, 100 of 365 days left.
    expect(upgradePrice('starter', 'growth', 'annual', inDays(100), now)).toBe(19200)
  })
  it('is 0 for a downgrade or a finished period', () => {
    expect(upgradePrice('pro', 'starter', 'monthly', inDays(15), now)).toBe(0)
    expect(upgradePrice('starter', 'growth', 'monthly', inDays(-1), now)).toBe(0)
  })
})
