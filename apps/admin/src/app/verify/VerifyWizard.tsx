'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestPhoneOtp, confirmPhoneOtp, submitIdentityDetails } from './actions'
import { Button } from '@bitvora/ui/src/Button'
import { Input } from '@bitvora/ui/src/Input'
import { Label } from '@bitvora/ui/src/Label'
import { AlertTriangle, Check } from 'switch-icons'
import type { VerificationStatus } from '../../lib/merchant-identity'

type Stage = 'phone' | 'otp' | 'details' | 'review'

function ErrorBox({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div role="alert" className="flex items-start gap-2 bg-pepper-50 text-pepper-600 text-sm rounded-lg px-3 py-2 mb-4">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      {message}
    </div>
  )
}

export function VerifyWizard({
  initialPhone,
  phoneVerified = false,
  hasPendingCode = false,
  status,
  nin,
  cacNumber,
  businessName,
  reviewNote,
}: {
  initialPhone: string | null
  phoneVerified?: boolean
  hasPendingCode?: boolean
  status: VerificationStatus
  nin: string | null
  cacNumber: string | null
  businessName: string | null
  reviewNote: string | null
}) {
  // Phone first (the number comes from signup), then NIN/CAC go to an owner
  // for a manual check. The code step only shows when a code was actually
  // sent and is still valid.
  const initialStage: Stage = !phoneVerified
    ? hasPendingCode ? 'otp' : 'phone'
    // 'pending' left over from the old automated check has no NIN/CAC to review.
    : status === 'pending' && nin && cacNumber ? 'review' : 'details'
  const [stage, setStage] = useState<Stage>(initialStage)
  const [phone, setPhone] = useState(initialPhone ?? '')
  const router = useRouter()

  const [otpRequestState, otpRequestAction, otpRequestPending] = useActionState(requestPhoneOtp, undefined)
  const [otpConfirmState, otpConfirmAction, otpConfirmPending] = useActionState(confirmPhoneOtp, undefined)
  const [detailsState, detailsAction, detailsPending] = useActionState(submitIdentityDetails, undefined)

  // Advance once per new action result. Checking the result on every render
  // instead would bounce "Use a different number" straight back to the code
  // step, because the last request's `sent: true` sticks around.
  const [seen, setSeen] = useState({ otpRequestState, otpConfirmState, detailsState })
  if (otpRequestState !== seen.otpRequestState) {
    setSeen((s) => ({ ...s, otpRequestState }))
    if (otpRequestState?.sent) setStage('otp')
  }
  if (otpConfirmState !== seen.otpConfirmState) {
    setSeen((s) => ({ ...s, otpConfirmState }))
    if (otpConfirmState?.verified) setStage(otpConfirmState.submitted ? 'review' : 'details')
  }
  if (detailsState !== seen.detailsState) {
    setSeen((s) => ({ ...s, detailsState }))
    if (detailsState?.submitted) setStage('review')
  }

  const sentTo = otpRequestState?.phone ?? (phone || null)
  const stepNumber = stage === 'phone' || stage === 'otp' ? 1 : stage === 'details' ? 2 : 3

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
            We&apos;ll text a 6-digit code to this number.
          </p>
          <ErrorBox message={otpRequestState?.error} />
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
          <ErrorBox message={otpConfirmState?.error} />
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

      {stage === 'details' && (
        <form action={detailsAction}>
          <h1 className="text-2xl font-display font-semibold mb-1">
            {status === 'failed' ? 'Update your details' : 'Your NIN and CAC details'}
          </h1>
          <p className="text-ink/50 text-sm mb-6">
            Our team checks these by hand before you can create a store.
          </p>
          {status === 'failed' && reviewNote && (
            <ErrorBox message={`We couldn't verify your details: ${reviewNote}`} />
          )}
          <ErrorBox message={detailsState?.error} />
          <Label htmlFor="businessName">Business name (as registered with CAC)</Label>
          <Input id="businessName" name="businessName" type="text" defaultValue={businessName ?? ''} required maxLength={200} className="px-2 py-3 mb-4" />
          <Label htmlFor="nin">NIN</Label>
          <Input id="nin" name="nin" type="text" inputMode="numeric" placeholder="11 digits" defaultValue={nin ?? ''} required maxLength={13} className="px-2 py-3 mb-4" />
          <Label htmlFor="cac">CAC number</Label>
          <Input id="cac" name="cac" type="text" placeholder="e.g. RC123456" defaultValue={cacNumber ?? ''} required maxLength={14} className="px-2 py-3" />
          <Button type="submit" disabled={detailsPending} className="w-full mt-6">
            {detailsPending ? 'Submitting...' : 'Submit for review'}
          </Button>
        </form>
      )}

      {stage === 'review' && (
        <div>
          <div className="w-12 h-12 rounded-xl bg-palm-50 flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-palm-600" />
          </div>
          <h1 className="text-2xl font-display font-semibold mb-1">We&apos;re checking your details</h1>
          <p className="text-ink/50 text-sm mb-6">
            Your phone is verified. Our team is reviewing your NIN and CAC details, and you&apos;ll be
            able to create your store as soon as they&apos;re approved.
          </p>
          <Button className="w-full" onClick={() => router.refresh()}>
            Check status
          </Button>
          <button
            type="button"
            className="text-sm text-indigo-600 font-medium mt-4 block mx-auto"
            onClick={() => setStage('details')}
          >
            Edit my details
          </button>
        </div>
      )}
    </div>
  )
}
