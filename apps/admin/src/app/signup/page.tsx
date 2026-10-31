'use client'

import { use, useActionState } from 'react'
import Link from 'next/link'
import { AuthLayout } from '../../components/AuthLayout'
import { Button } from '@bitvora/ui/src/Button'
import { Input } from '@bitvora/ui/src/Input'
import { Label } from '@bitvora/ui/src/Label'
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react'
import { signUp } from './actions'
import { PasswordInput } from '../../components/PasswordInput'
import { MIN_PASSWORD_LENGTH } from '../../lib/password'
import { PLAN_NAMES, parseInterval, parsePlan } from '../../lib/plans'
import { PlanOptions } from '../../components/PlanOptions'
import { WEBSITE_URL } from '../../lib/website-url'

export default function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string; interval?: string }> }) {
  const [state, action, pending] = useActionState(signUp, undefined)
  // Set by the pricing page's "Get <plan>" buttons.
  const params = use(searchParams)
  const plan = parsePlan(params.plan)
  const interval = parseInterval(params.interval) ?? 'monthly'
  const v = state?.values ?? {}

  if (state?.checkEmail) {
    return (
      <AuthLayout>
        <div className="w-12 h-12 rounded-xl bg-palm-50 flex items-center justify-center mb-4">
          <IconCheck className="w-6 h-6 text-palm-600" />
        </div>
        <h1 className="text-2xl font-display font-semibold mb-1">Check your email</h1>
        <p className="text-sm text-ink/50 mb-6">
          We sent you a link to confirm your account. Open it to continue to phone verification.
        </p>
        <Link href="/login" className="text-indigo-600 font-medium text-sm">Go to log in</Link>
      </AuthLayout>
    )
  }

  // Every account starts with a plan: without one from the pricing page,
  // pick it here first. The choice rides along in the URL.
  if (!plan) {
    return (
      <AuthLayout>
        <h1 className="text-2xl font-display font-semibold mb-1">Pick your plan</h1>
        <p className="text-sm text-ink/50 mb-6">
          You&apos;ll pay for it after you&apos;ve verified your phone, before you create your first store.{' '}
          <a href={`${WEBSITE_URL}/pricing`} target="_blank" rel="noopener" className="text-indigo-600 font-medium">Compare plans</a>
        </p>
        <PlanOptions defaultInterval={interval} hrefFor={(p, i) => `/signup?plan=${p}&interval=${i}`} />
        <p className="text-sm text-ink/50 mt-6 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 font-medium">Log in</Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-display font-semibold mb-1">Create your account</h1>
      <p className="text-sm text-ink/50 mb-8">
        Just the basics for now. We&apos;ll text you a code to confirm your phone next.
      </p>

      <p className="text-sm bg-indigo-50 text-indigo-600 rounded-lg px-3 py-2 mb-4">
        You picked the <span className="font-medium">{PLAN_NAMES[plan]}</span> plan, billed {interval === 'annual' ? 'annually' : 'monthly'}.{' '}
        <Link href={`/signup?interval=${interval}`} className="font-medium underline">Change</Link>
      </p>

      {state?.error && (
        <div role="alert" className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2 mb-4">
          <IconAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}

      {/* key: remount with the echoed values after each attempt, so a failed
          submit keeps what was typed (passwords excepted). */}
      <form key={JSON.stringify(v)} action={action} className="space-y-4">
        <input type="hidden" name="plan" value={plan} />
        <input type="hidden" name="interval" value={interval} />
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" type="text" autoComplete="name" defaultValue={v.fullName} required maxLength={100} className="px-2 py-3" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" defaultValue={v.email} required className="px-2 py-3" />
        </div>
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="080..." defaultValue={v.phone} required className="px-2 py-3" />
          <p className="text-xs text-ink/40 mt-1">We&apos;ll text a code to this number next.</p>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} className="px-2 py-3" />
          <p className="text-xs text-ink/40 mt-1">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>
        <label className="flex items-start gap-2 text-sm text-ink/60">
          <input type="checkbox" name="acceptTerms" required className="mt-0.5 rounded border-sand-200 text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600" />
          <span>
            I agree to the{' '}
            <a href={`${WEBSITE_URL}/terms`} target="_blank" rel="noopener" className="text-indigo-600 font-medium">Terms of Service</a>
            {' '}and{' '}
            <a href={`${WEBSITE_URL}/privacy`} target="_blank" rel="noopener" className="text-indigo-600 font-medium">Privacy Policy</a>.
          </span>
        </label>
        {/* Was `bg-ink` — see LoginPage for why that breaks in dark mode. */}
        <Button type="submit" disabled={pending} variant="primary" className="w-full">
          {pending ? 'Creating account...' : 'Sign up'}
        </Button>
      </form>

      <p className="text-sm text-ink/50 mt-6 text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-600 font-medium">Log in</Link>
      </p>
    </AuthLayout>
  )
}
