'use client'

import { useActionState } from 'react'

import { Label } from '@bitvora/ui/src/Label'
import { Input } from '@bitvora/ui/src/Input'
import { Button } from '@bitvora/ui/src/Button'
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react'
import { updateProfile } from './action'

export function ProfileForm({
  email,
  initialFullName,
  initialPhone,
  initialBusinessName,
}: {
  email: string
  initialFullName: string
  initialPhone: string
  initialBusinessName: string
}) {
  const [state, formAction, pending] = useActionState<
    Awaited<ReturnType<typeof updateProfile>> | undefined,
    FormData
  >(
    async (_state, formData) => updateProfile(formData),
    undefined,
  )

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div role="alert" className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2">
          <IconAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled className="bg-sand-100 text-ink/50" />
        <p className="text-xs text-ink/40 mt-1">You sign in with this. It can’t be changed here.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" defaultValue={initialFullName} autoComplete="name" required />
        </div>
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={initialPhone} placeholder="+234..." />
        </div>
      </div>
      <div>
        <Label htmlFor="business_name">Business name</Label>
        <Input id="business_name" name="business_name" defaultValue={initialBusinessName} autoComplete="organization" placeholder="e.g. Ada Crafts Ltd" />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? 'Saving...' : 'Save changes'}
        </Button>
        {state?.saved && !pending && (
          <p role="status" className="flex items-center justify-center gap-1.5 text-sm text-palm-600">
            <IconCheck className="w-4 h-4" /> Saved
          </p>
        )}
      </div>
    </form>
  )
}
