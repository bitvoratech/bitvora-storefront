'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@bitvora/ui/src/Button'
import { Input } from '@bitvora/ui/src/Input'
import { Label } from '@bitvora/ui/src/Label'
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react'
import { createClient } from '../../lib/supabase/client'
import { AuthLayout } from '../../components/AuthLayout'

// useSearchParams needs a Suspense boundary to prerender.
export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}

function ForgotPasswordForm() {
  const expired = useSearchParams().get('expired') === '1'
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    // The link signs the merchant in through /auth/confirm, then opens the
    // page where they choose a new password.
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    })
    setLoading(false)
    // Don't reveal whether the email has an account; only rate limits surface.
    if (error && error.status === 429) {
      setError('Too many reset emails. Wait a few minutes and try again.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="w-12 h-12 rounded-xl bg-palm-50 flex items-center justify-center mb-4">
          <IconCheck className="w-6 h-6 text-palm-600" />
        </div>
        <h1 className="text-2xl font-display font-semibold mb-1">Check your email</h1>
        <p className="text-sm text-ink/50 mb-6">
          If an account exists for <span className="font-medium text-ink">{email}</span>, we sent it a link to
          reset your password. Open it on this device.
        </p>
        <Link href="/login" className="text-indigo-600 font-medium text-sm">Back to log in</Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-display font-semibold mb-1">Reset your password</h1>
      <p className="text-sm text-ink/50 mb-8">Enter your account email and we&apos;ll send you a reset link.</p>

      {(error || expired) && (
        <div role="alert" className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2 mb-4">
          <IconAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error ?? 'That reset link has expired or was already used. Request a new one.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="px-2 py-3" />
        </div>
        <Button type="submit" disabled={loading} variant="primary" className="w-full">
          {loading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <p className="text-sm text-ink/50 mt-6 text-center">
        Remembered it? <Link href="/login" className="text-indigo-600 font-medium">Log in</Link>
      </p>
    </AuthLayout>
  )
}
