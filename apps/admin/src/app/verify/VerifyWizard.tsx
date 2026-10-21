'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestPhoneOtp, confirmPhoneOtp, submitIdentityVerification } from './actions'
import { Button } from '@bitvora/ui/src/Button'
import { Input } from '@bitvora/ui/src/Input'
import { Label } from '@bitvora/ui/src/Label'
import { Select } from '@bitvora/ui/src/Select'
import { AlertTriangle, Check } from 'switch-icons'

type Stage = 'phone' | 'otp' | 'identity' | 'done'

export function VerifyWizard({
  initialPhone,
  phoneVerified = false,
  hasPendingCode = false,
}: {
  initialPhone: string | null
  phoneVerified?: boolean
  hasPendingCode?: boolean
}) {
  // A merchant whose phone is already verified (e.g. a failed identity check
  // earlier) resumes at the identity step instead of redoing the OTP. The code
  // step is only shown when a code was actually sent and is still valid;
  // having a phone number on file (e.g. from the profile) isn't enough.
  const [stage, setStage] = useState<Stage>(phoneVerified ? 'identity' : hasPendingCode ? 'otp' : 'phone')
  const [idType, setIdType] = useState<'nin' | 'cac'>('nin')
  const [phone, setPhone] = useState(initialPhone ?? '')
  const router = useRouter()

  const [otpRequestState, otpRequestAction, otpRequestPending] = useActionState(requestPhoneOtp, undefined)
  const [otpConfirmState, otpConfirmAction, otpConfirmPending] = useActionState(confirmPhoneOtp, undefined)
  const [identityState, identityAction, identityPending] = useActionState(submitIdentityVerification, undefined)

  // Advance once per new action result. Checking the result on every render
  // instead would bounce "Use a different number" straight back to the code
  // step, because the last request's `sent: true` sticks around.
  const [seen, setSeen] = useState({ otpRequestState, otpConfirmState, identityState })
  if (otpRequestState !== seen.otpRequestState) {
    setSeen((s) => ({ ...s, otpRequestState }))
    if (otpRequestState?.sent) setStage('otp')
  }
  if (otpConfirmState !== seen.otpConfirmState) {
    setSeen((s) => ({ ...s, otpConfirmState }))
    if (otpConfirmState?.verified) setStage('identity')
  }
  if (identityState !== seen.identityState) {
    setSeen((s) => ({ ...s, identityState }))
    if (identityState?.result === 'verified') setStage('done')
  }

  const sentTo = otpRequestState?.phone ?? (phone || null)

  const stepNumber = stage === 'phone' ? 1 : stage === 'otp' ? 1 : stage === 'identity' ? 2 : 3

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="flex items-center gap-2 mb-8">
        <div className={`h-1.5 flex-1 rounded-full ${stepNumber >= 1 ? 'bg-indigo-600' : 'bg-sand-200'}`} />
        <div className={`h-1.5 flex-1 rounded-full ${stepNumber >= 2 ? 'bg-indigo-600' : 'bg-sand-200'}`} />
        <div className={`h-1.5 flex-1 rounded-full ${stepNumber >= 3 ? 'bg-indigo-600' : 'bg-sand-200'}`} />
      </div>

      {stage === 'phone' && (
        <form action={otpRequestAction}>
          <h1 className="text-2xl font-display font-semibold mb-1">Verify your phone</h1>
          <p className="text-ink/50 text-sm mb-6">
            We use this to confirm it&apos;s really you before you can create a store.
          </p>
          {otpRequestState?.error && (
            <div className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {otpRequestState.error}
            </div>
          )}
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="080..." required value={phone} onChange={(e) => setPhone(e.target.value)} className="px-2 py-3" />
          <Button type="submit" disabled={otpRequestPending} className="w-full mt-6">
            {otpRequestPending ? 'Sending code...' : 'Send code'}
          </Button>
        </form>
      )}

      {stage === 'otp' && (
        <form action={otpConfirmAction}>
          <h1 className="text-2xl font-display font-semibold mb-1">Enter the code</h1>
          <p className="text-ink/50 text-sm mb-6">
            We sent a 6-digit code by SMS{sentTo ? ` to ${sentTo}` : ''}. It expires in 10 minutes.
          </p>
          {otpConfirmState?.error && (
            <div className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {otpConfirmState.error}
            </div>
          )}
          <Label htmlFor="code">Verification code</Label>
          <Input id="code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required className="px-2 py-3 tracking-widest" />
          <Button type="submit" disabled={otpConfirmPending} className="w-full mt-6">
            {otpConfirmPending ? 'Checking...' : 'Confirm code'}
          </Button>
          <button
            type="button"
            className="text-sm text-indigo-600 font-medium mt-4 block mx-auto"
            onClick={() => setStage('phone')}
          >
            Didn&apos;t get it? Resend or use a different number
          </button>
        </form>
      )}

      {stage === 'identity' && (
        <form action={identityAction}>
          <h1 className="text-2xl font-display font-semibold mb-1">Verify your identity</h1>
          <p className="text-ink/50 text-sm mb-6">
            Required before you can create a store on Bitvora Storefront.
          </p>
          {identityState?.error && (
            <div className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {identityState.error}
            </div>
          )}

          <Label htmlFor="type">Verification type</Label>
          <Select
            id="type"
            name="type"
            value={idType}
            onChange={(e) => setIdType(e.target.value as 'nin' | 'cac')}
            className="mb-4"
          >
            <option value="nin">Individual — NIN</option>
            <option value="cac">Registered business — CAC (RC number)</option>
          </Select>

          {idType === 'nin' ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" name="firstName" type="text" required className="px-2 py-3" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" name="lastName" type="text" required className="px-2 py-3" />
                </div>
              </div>
              <Label htmlFor="reference">NIN</Label>
              <Input id="reference" name="reference" type="text" inputMode="numeric" maxLength={11} required className="px-2 py-3" />
            </>
          ) : (
            <>
              <Label htmlFor="companyName">Registered business name</Label>
              <Input id="companyName" name="companyName" type="text" required className="px-2 py-3 mb-4" />
              <Label htmlFor="reference">CAC (RC) number</Label>
              <Input id="reference" name="reference" type="text" required className="px-2 py-3" />
            </>
          )}

          <Button type="submit" disabled={identityPending} className="w-full mt-6">
            {identityPending ? 'Verifying...' : 'Verify'}
          </Button>
        </form>
      )}

      {stage === 'done' && (
        <div>
          <div className="w-12 h-12 rounded-xl bg-palm-50 flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-palm-600" />
          </div>
          <h1 className="text-2xl font-display font-semibold mb-1">You&apos;re verified</h1>
          <p className="text-ink/50 text-sm mb-6">
            You can now create your store.
          </p>
          <Button className="w-full" onClick={() => router.refresh()}>
            Continue to create your store
          </Button>
        </div>
      )}
    </div>
  )
}