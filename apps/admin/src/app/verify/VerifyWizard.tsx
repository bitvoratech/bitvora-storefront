'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestPhoneOtp, confirmPhoneOtp, submitIdentityDetails } from './actions'
import { Button } from '@bitvora/ui/src/Button'
import { Input } from '@bitvora/ui/src/Input'
import { Label } from '@bitvora/ui/src/Label'
import { AlertTriangle, Check } from 'switch-icons'
import { COMPLIANCE_GRACE_DAYS, complianceDaysLeft, type VerificationStatus } from '../../lib/merchant-identity'
import { createClient } from '../../lib/supabase/client'

type Stage = 'phone' | 'otp' | 'details' | 'review'

const STEPS = ['Phone', 'Payment', 'Compliance']

// Saved numbers are 2348012345678; merchants know them as 0801 234 5678.
function displayPhone(phone: string) {
  const m = phone.match(/^234(\d{3})(\d{3})(\d{4})$/)
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : phone
}

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
  planPaid = false,
  justPaid = false,
  complianceDueAt = null,
}: {
  initialPhone: string | null
  phoneVerified?: boolean
  hasPendingCode?: boolean
  status: VerificationStatus
  nin: string | null
  cacNumber: string | null
  businessName: string | null
  reviewNote: string | null
  planPaid?: boolean
  justPaid?: boolean
  complianceDueAt?: string | null
}) {
  // Phone first (the number comes from signup), then payment for the plan on
  // /billing, then the optional compliance step: NIN/CAC go to an owner for a
  // manual check, and approval earns the Verified seller badge. Skipping it
  // takes the store offline after COMPLIANCE_GRACE_DAYS. The code step only
  // shows when a code was actually sent and is still valid.
  const initialStage: Stage = !phoneVerified
    ? hasPendingCode ? 'otp' : 'phone'
    // 'pending' left over from the old automated check has no NIN/CAC to review.
    : status === 'pending' && nin && cacNumber ? 'review' : 'details'
  const [stage, setStage] = useState<Stage>(initialStage)
  const [phone, setPhone] = useState(initialPhone ?? '')
  const [editingPhone, setEditingPhone] = useState(!initialPhone)
  const [confirmingSkip, setConfirmingSkip] = useState(false)
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
    if (otpConfirmState?.verified) {
      // Payment comes straight after the phone; billing sends them back here.
      if (!planPaid) router.push('/billing')
      else setStage(otpConfirmState.submitted ? 'review' : 'details')
    }
  }
  if (detailsState !== seen.detailsState) {
    setSeen((s) => ({ ...s, detailsState }))
    if (detailsState?.submitted) setStage('review')
  }

  const goToDashboard = () => {
    router.push('/')
    router.refresh()
  }

  const sentTo = otpRequestState?.phone ?? (phone || null)
  const stepNumber = stage === 'phone' || stage === 'otp' ? 1 : 3
  const daysLeft = complianceDaysLeft(complianceDueAt)
  const dueDate = complianceDueAt
    ? new Date(complianceDueAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long' })
    : null

  return (
    <div>
      <ol className="grid grid-cols-3 gap-2 mb-8" aria-label="Verification steps">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={stepNumber === i + 1 ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full ${stepNumber >= i + 1 ? 'bg-indigo-600' : 'bg-sand-200'}`} />
            <p className={`text-xs mt-1.5 ${stepNumber === i + 1 ? 'text-ink font-medium' : 'text-ink/40'}`}>
              <span className="sr-only">Step {i + 1}: </span>{label}
            </p>
          </li>
        ))}
      </ol>

      {stage === 'phone' && (
        <form action={otpRequestAction}>
          <h1 className="text-2xl font-display font-semibold mb-1">Verify your phone</h1>
          <p className="text-ink/50 text-sm mb-6">
            We&apos;ll text a 6-digit code to {editingPhone ? 'your number' : 'the number you signed up with'}.
          </p>
          <ErrorBox message={otpRequestState?.error} />
          {editingPhone ? (
            <>
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="080..." required value={phone} onChange={(e) => setPhone(e.target.value)} className="px-2 py-3" />
            </>
          ) : (
            // The number came from signup: confirm it rather than retype it.
            <div className="flex items-center justify-between gap-3 rounded-lg border border-sand-200 bg-white dark:bg-sand-100 px-3 py-3">
              <input type="hidden" name="phone" value={phone} />
              <span className="font-mono text-sm">{displayPhone(phone)}</span>
              <button type="button" onClick={() => setEditingPhone(true)} className="text-sm text-indigo-600 font-medium">
                Change
              </button>
            </div>
          )}
          <Button type="submit" disabled={otpRequestPending} className="w-full mt-6">
            {otpRequestPending ? 'Sending code...' : 'Send code'}
          </Button>
        </form>
      )}

      {stage === 'otp' && (
        <form action={otpConfirmAction}>
          <h1 className="text-2xl font-display font-semibold mb-1">Enter the code</h1>
          <p className="text-ink/50 text-sm mb-6">
            We sent a 6-digit code by SMS{sentTo ? ` to ${displayPhone(sentTo)}` : ''}. It expires in 10 minutes.
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

      {stage === 'details' && !confirmingSkip && (
        <form action={detailsAction}>
          <h1 className="text-2xl font-display font-semibold mb-1">
            {status === 'failed' ? 'Update your details' : 'Get your Verified seller badge'}
          </h1>
          {justPaid && (
            <p className="text-sm bg-palm-50 text-palm-600 rounded-lg px-3 py-2 mb-4">
              Payment received. Your plan is active.
            </p>
          )}
          <p className="text-ink/50 text-sm mb-6">
            Add your NIN and CAC number and our team will check them by hand. Once they&apos;re
            approved, your store shows a Verified seller badge so customers know they can trust you.
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
          {/* Compliance is optional: skipping only costs the badge, after a warning. */}
          <button
            type="button"
            className="text-sm text-ink/60 hover:text-ink font-medium mt-4 block mx-auto"
            onClick={() => (status === 'unverified' ? setConfirmingSkip(true) : goToDashboard())}
          >
            {status === 'unverified' ? 'Skip for now' : 'Back to dashboard'}
          </button>
        </form>
      )}

      {stage === 'details' && confirmingSkip && (
        <div>
          <div className="w-12 h-12 rounded-xl bg-marigold-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-marigold-500" />
          </div>
          <h1 className="text-2xl font-display font-semibold mb-1">Skip verification?</h1>
          <p className="text-ink/50 text-sm mb-6">
            Without your NIN and CAC details:
          </p>
          <ul className="text-sm text-ink/70 space-y-2 mb-6 list-disc pl-5">
            <li>Your store won&apos;t get the Verified seller badge that tells customers you&apos;ve been checked by Bitvora.</li>
            <li>
              Your store will be disabled {daysLeft !== null && dueDate ? `in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${dueDate})` : `after ${COMPLIANCE_GRACE_DAYS} days`}{' '}
              until you send them.
            </li>
          </ul>
          <p className="text-ink/50 text-sm mb-6">You can finish this any time from your dashboard.</p>
          <Button className="w-full" onClick={() => setConfirmingSkip(false)}>
            Add my details now
          </Button>
          <button
            type="button"
            className="text-sm text-ink/60 hover:text-ink font-medium mt-4 block mx-auto"
            onClick={goToDashboard}
          >
            Skip for now
          </button>
        </div>
      )}

      {stage === 'review' && (
        <div>
          <div className="w-12 h-12 rounded-xl bg-palm-50 flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-palm-600" />
          </div>
          <h1 className="text-2xl font-display font-semibold mb-1">We&apos;re checking your details</h1>
          <p className="text-ink/50 text-sm mb-6">
            Your phone is verified. Our team is reviewing your NIN and CAC details, and your store
            will get the Verified seller badge as soon as they&apos;re approved. You can set up your
            store in the meantime.
          </p>
          <Button className="w-full" onClick={goToDashboard}>
            Go to dashboard
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

      {/* New merchants land here straight after signup, so give them a way out. */}
      <button
        type="button"
        className="text-sm text-ink/50 hover:text-ink mt-10 block mx-auto"
        onClick={async () => {
          await createClient().auth.signOut()
          router.push('/login')
          router.refresh()
        }}
      >
        Log out
      </button>
    </div>
  )
}
