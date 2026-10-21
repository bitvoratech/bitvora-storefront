'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@bitvora/ui/src/Button'
import { Input } from '@bitvora/ui/src/Input'
import { Label } from '@bitvora/ui/src/Label'
import { AlertTriangle, Check } from 'switch-icons'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import { AuthLayout } from '../../components/AuthLayout'
import { PasswordInput } from '../../components/PasswordInput'

// Supabase's own wording ("Invalid login credentials") reads like a system
// error; say what happened and what to do instead.
function friendlyLoginError(code: string | undefined, message: string) {
  if (code === 'invalid_credentials') return 'That email and password don’t match. Check them and try again.'
  if (code === 'email_not_confirmed') return 'Confirm your email first. Open the link we sent when you signed up.'
  if (code === 'over_request_rate_limit') return 'Too many attempts. Wait a few minutes and try again.'
  return message
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setUnconfirmed(false)
    setResent(false)
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      setError(friendlyLoginError(error.code, error.message))
      setUnconfirmed(error.code === 'email_not_confirmed')
      return
    }

    router.push('/')
    router.refresh()
  }

  async function resendConfirmation() {
    const { error } = await createClient().auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/verify` },
    })
    if (error) {
      setError(error.status === 429 ? 'We just sent one. Wait a minute before asking again.' : error.message)
      return
    }
    setError(null)
    setResent(true)
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-display font-semibold mb-1">Log in</h1>
      <p className="text-sm text-ink/50 mb-8">Welcome back — manage your store.</p>

      {error && (
        <div role="alert" className="bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2 mb-4">
          <p className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </p>
          {unconfirmed && (
            <button type="button" onClick={resendConfirmation} className="font-medium underline mt-1 ml-6">
              Send the link again
            </button>
          )}
        </div>
      )}
      {resent && (
        <div role="status" className="flex items-start gap-2 bg-palm-50 text-palm-600 text-sm rounded-lg px-3 py-2 mb-4">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          Sent. Check your inbox (and spam) for the confirmation link.
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required  className="px-2 py-3"/>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-indigo-600 font-medium">Forgot password?</Link>
          </div>
          <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="px-2 py-3"/>
        </div>
        {/*
          Was `bg-ink` — that token is inverted for dark mode (it's meant
          for text, not a solid button surface), so it went from a
          near-black button in light mode to a near-white one in dark mode
          with white text on top: invisible. `variant="primary"` uses the
          actual indigo brand color, which is already dark-mode-correct.
        */}
        <Button type="submit" disabled={loading} variant="primary" className="w-full">
          {loading ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <p className="text-sm text-ink/50 mt-6 text-center">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-indigo-600 font-medium">Sign up</Link>
      </p>
    </AuthLayout>
  )
}
