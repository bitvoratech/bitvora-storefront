'use client'

import { useState, useTransition } from 'react'
import { Label } from '@bitvora/ui/src/Label'
import { Input } from '@bitvora/ui/src/Input'
import { Button } from '@bitvora/ui/src/Button'
import { AlertTriangle } from 'switch-icons'
import { createClient } from '../../lib/supabase/client'

export function PasswordForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const password = String(data.get('password') ?? '')
    const confirm = String(data.get('confirm') ?? '')
    setError(null)
    setSaved(false)
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError('The passwords don’t match.')

    startTransition(async () => {
      const { error } = await createClient().auth.updateUser({ password })
      if (error) {
        setError(error.message)
        return
      }
      form.reset()
      setSaved(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {saved && <p className="bg-palm-50 text-palm-600 text-sm rounded-lg px-3 py-2">Password updated.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="new_password">New password</Label>
          <Input id="new_password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <div>
          <Label htmlFor="confirm_password">Confirm password</Label>
          <Input id="confirm_password" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Change password'}</Button>
    </form>
  )
}
