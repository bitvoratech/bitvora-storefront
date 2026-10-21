'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { AuthLayout } from '../../components/AuthLayout'
import { Button } from '@bitvora/ui/src/Button'
import { Input } from '@bitvora/ui/src/Input'
import { Label } from '@bitvora/ui/src/Label'
import { AlertTriangle, Check } from 'switch-icons'
import { signUp } from './actions'

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUp, undefined)
  const v = state?.values ?? {}

  if (state?.checkEmail) {
    return (
      <AuthLayout>
        <div className="w-12 h-12 rounded-xl bg-palm-50 flex items-center justify-center mb-4">
          <Check className="w-6 h-6 text-palm-600" />
        </div>
        <h1 className="text-2xl font-display font-semibold mb-1">Check your email</h1>
        <p className="text-sm text-ink/50 mb-6">
          We sent you a link to confirm your account. After that, log in to verify your phone number.
        </p>
        <Link href="/login" className="text-indigo-600 font-medium text-sm">Go to log in</Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-display font-semibold mb-1">Create your account</h1>
      <p className="text-sm text-ink/50 mb-8">
        We check every merchant&apos;s NIN and CAC details before their store can go live.
      </p>

      {state?.error && (
        <div role="alert" className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2 mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}

      {/* key: remount with the echoed values after each attempt, so a failed
          submit keeps what was typed (passwords excepted). */}
      <form key={JSON.stringify(v)} action={action} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" type="text" autoComplete="name" defaultValue={v.fullName} required maxLength={100} className="px-2 py-3" />
        </div>
        <div>
          <Label htmlFor="businessName">Business name (as registered with CAC)</Label>
          <Input id="businessName" name="businessName" type="text" autoComplete="organization" defaultValue={v.businessName} required maxLength={200} className="px-2 py-3" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nin">NIN</Label>
            <Input id="nin" name="nin" type="text" inputMode="numeric" placeholder="11 digits" defaultValue={v.nin} required maxLength={13} className="px-2 py-3" />
          </div>
          <div>
            <Label htmlFor="cac">CAC number</Label>
            <Input id="cac" name="cac" type="text" placeholder="e.g. RC123456" defaultValue={v.cac} required maxLength={14} className="px-2 py-3" />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} className="px-2 py-3" />
        </div>
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
