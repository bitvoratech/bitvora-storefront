'use client'

import { useActionState } from 'react'
import { Button } from '@bitvora/ui/src/Button'
import { Input } from '@bitvora/ui/src/Input'
import { Label } from '@bitvora/ui/src/Label'
import { IconAlertTriangle } from '@tabler/icons-react'
import { addAdmin, type AddAdminResult } from './actions'

export function AddAdminForm() {
  const [state, formAction, isPending] = useActionState<AddAdminResult | undefined, FormData>(addAdmin, undefined)

  return (
    <form action={formAction} className="space-y-4">
      {state && 'error' in state && (
        <div className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2">
          <IconAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}
      {state && 'ok' in state && (
        <div className="bg-palm-50 text-palm-600 text-sm rounded-lg px-3 py-2 space-y-1">
          <p>{state.email} is now an admin.</p>
          {state.tempPassword ? (
            <p>
              Their one-time password is <code className="font-mono select-all bg-white/60 dark:bg-black/20 rounded px-1">{state.tempPassword}</code>.
              Send it to them privately; it won&apos;t be shown again. They can change it from their Profile page.
            </p>
          ) : (
            <p>They already had an account, so they keep their current password.</p>
          )}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="admin_email">Email</Label>
          <Input id="admin_email" name="email" type="email" required placeholder="name@example.com" />
        </div>
        <div>
          <Label htmlFor="admin_name">Full name</Label>
          <Input id="admin_name" name="full_name" type="text" maxLength={100} placeholder="Optional" />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>{isPending ? 'Adding...' : 'Add admin'}</Button>
    </form>
  )
}
