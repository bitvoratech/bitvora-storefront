'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@bitvora/ui/src/Button'
import { Label } from '@bitvora/ui/src/Label'
import { IconAlertTriangle } from '@tabler/icons-react'
import { createClient } from '../../lib/supabase/client'
import { AuthLayout } from '../../components/AuthLayout'
import { PasswordInput } from '../../components/PasswordInput'
import { MIN_PASSWORD_LENGTH, passwordError } from '../../lib/password'

// Reached from the reset email via /auth/confirm, which has already signed
// the merchant in; the middleware sends anyone without a session back to
// /forgot-password.
export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const invalid = passwordError(password)
    if (invalid) return setError(invalid)
    if (password !== confirm) return setError('The two passwords don’t match.')

    setError(null)
    setLoading(true)
    const { error } = await createClient().auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.code === 'same_password' ? 'Choose a password you haven’t used here before.' : error.message)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-display font-semibold mb-1">Choose a new password</h1>
      <p className="text-sm text-ink/50 mb-8">You&apos;ll stay logged in on this device.</p>

      {error && (
        <div role="alert" className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2 mb-4">
          <IconAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={MIN_PASSWORD_LENGTH} className="px-2 py-3" />
          <p className="text-xs text-ink/40 mt-1">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>
        <div>
          <Label htmlFor="confirm">Confirm new password</Label>
          <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={MIN_PASSWORD_LENGTH} className="px-2 py-3" />
        </div>
        <Button type="submit" disabled={loading} variant="primary" className="w-full">
          {loading ? 'Saving...' : 'Save new password'}
        </Button>
      </form>
    </AuthLayout>
  )
}
