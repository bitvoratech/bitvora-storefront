'use server'

import { createHash, randomInt, timingSafeEqual } from 'crypto'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { normalizeNigerianPhone, sendSms } from '../../lib/termii'
import { verifyCac, verifyNin } from '../../lib/identity-verification'
import { rateLimit } from '../../lib/rate-limit' 

const OTP_TTL_MINUTES = 10
const MAX_OTP_ATTEMPTS = 5

function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex')
}

function hashesMatch(a: string, b: string) {
  const ab = Buffer.from(a, 'hex')
  const bb = Buffer.from(b, 'hex')
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

// Merchants can't write OTP rows, the audit log, or verification columns
// themselves (see the security_hardening migration) — every privileged write
// below goes through the service-role client, scoped to the session's merchant.

async function getMerchant() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant, error } = await supabase
    .from('merchants')
    .select('id, verification_status, phone, phone_verified_at')
    .eq('user_id', user.id)
    .single()

  if (error || !merchant) redirect('/login')
  return { supabase, admin: createAdminClient(), merchant }
}

export async function requestPhoneOtp(prevState: { error?: string; sent?: boolean } | undefined, formData: FormData) {
  const { admin, merchant } = await getMerchant()

  const rawPhone = formData.get('phone') as string
  let phone: string
  try {
    phone = normalizeNigerianPhone(rawPhone)
  } catch {
    return { error: 'Enter a valid Nigerian phone number.' }
  }

  const byMerchant = await rateLimit('otp-send', merchant.id, 3, '10 m', { failOpen: false })
  const byPhone = await rateLimit('otp-phone', phone, 3, '1 h', { failOpen: false })
  if (!byMerchant.ok || !byPhone.ok) {
    return { error: `Too many code requests. Try again in ${Math.max(byMerchant.retryAfter, byPhone.retryAfter)}s.` }
  }

  const code = randomInt(100000, 999999).toString()
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()

  // Only the newest code is ever valid.
  await admin
    .from('merchant_otps')
    .update({ consumed_at: new Date().toISOString() })
    .eq('merchant_id', merchant.id)
    .is('consumed_at', null)

  const { error: insertError } = await admin.from('merchant_otps').insert({
    merchant_id: merchant.id,
    phone,
    code_hash: hashCode(code),
    expires_at: expiresAt,
  })

  if (insertError) {
    return { error: 'Could not start verification. Try again.' }
  }

  // Keep phone on the merchant row so the UI can prefill it, but not verified yet.
  // (A DB trigger clears phone_verified_at when the number changes.)
  await admin.from('merchants').update({ phone }).eq('id', merchant.id)

  try {
    await sendSms(phone, `Your Bitvora Storefront verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`)
  } catch {
    return { error: 'Could not send SMS right now. Try again in a moment.' }
  }

  return { sent: true }
}

export async function confirmPhoneOtp(prevState: { error?: string; verified?: boolean } | undefined, formData: FormData) {
  const { admin, merchant } = await getMerchant()

  const code = (formData.get('code') as string || '').trim()
  if (!code) return { error: 'Enter the code we sent you.' }
  if (!/^\d{6}$/.test(code)) return { error: 'The code is 6 digits.' }

  const rl = await rateLimit('otp-confirm', merchant.id, 10, '10 m', { failOpen: false })
  if (!rl.ok) return { error: `Too many attempts. Try again in ${rl.retryAfter}s.` }

  const { data: otpRow } = await admin
    .from('merchant_otps')
    .select('*')
    .eq('merchant_id', merchant.id)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!otpRow) return { error: 'No pending code found. Request a new one.' }

  if (new Date(otpRow.expires_at).getTime() < Date.now()) {
    return { error: 'That code expired. Request a new one.' }
  }

  if (otpRow.attempts >= MAX_OTP_ATTEMPTS) {
    return { error: 'Too many attempts. Request a new code.' }
  }

  if (!hashesMatch(hashCode(code), otpRow.code_hash)) {
    await admin.from('merchant_otps').update({ attempts: otpRow.attempts + 1 }).eq('id', otpRow.id)
    return { error: 'Incorrect code. Try again.' }
  }

  // Conditional on consumed_at still being null, so a code can't be redeemed twice.
  const { data: consumed } = await admin
    .from('merchant_otps')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', otpRow.id)
    .is('consumed_at', null)
    .select('id')
  if (!consumed?.length) return { error: 'That code was already used. Request a new one.' }

  // Verify the number the code was actually sent to.
  const { error: verifyError } = await admin
    .from('merchants')
    .update({ phone: otpRow.phone, phone_verified_at: new Date().toISOString() })
    .eq('id', merchant.id)
  if (verifyError) return { error: 'Could not save verification. Try again.' }

  return { verified: true }
}

export async function submitIdentityVerification(
  prevState: { error?: string; result?: 'verified' | 'failed' } | undefined,
  formData: FormData
) {
  const { admin, merchant } = await getMerchant()

  if (merchant.verification_status === 'verified') return { result: 'verified' as const }
  if (!merchant.phone_verified_at) return { error: 'Verify your phone number first.' }

  const rl = await rateLimit('identity', merchant.id, 5, '1 h', { failOpen: false })
  if (!rl.ok) return { error: 'Too many verification attempts. Try again later.' }

  const type = formData.get('type') as 'nin' | 'cac'
  const reference = (formData.get('reference') as string || '').replace(/\s/g, '').toUpperCase()
  const firstName = (formData.get('firstName') as string || '').trim()
  const lastName = (formData.get('lastName') as string || '').trim()
  const companyName = (formData.get('companyName') as string || '').trim()

  if (type !== 'nin' && type !== 'cac') {
    return { error: 'Choose an ID type.' }
  }

  if (!reference) {
    return { error: type === 'nin' ? 'Enter your NIN.' : 'Enter your CAC (RC) number.' }
  }

  // The reference goes into the provider URL path, so only allow the real formats.
  if (type === 'nin' && !/^\d{11}$/.test(reference)) {
    return { error: 'NIN must be 11 digits.' }
  }
  if (type === 'cac' && !/^(RC|BN)?\d{1,10}$/.test(reference)) {
    return { error: 'Enter a valid RC or BN number, e.g. RC123456.' }
  }
  if (type === 'nin' && (!firstName || !lastName)) {
    return { error: 'Enter your first and last name as they appear on your NIN.' }
  }
  if (type === 'cac' && !companyName) {
    return { error: 'Enter your registered company name.' }
  }

  await admin.from('merchants').update({
    verification_status: 'pending',
    verification_type: type,
    verification_reference: reference,
  }).eq('id', merchant.id)

  try {
    const result = type === 'nin'
      ? await verifyNin(reference, firstName, lastName)
      : await verifyCac(reference, companyName)

    await admin.from('merchant_verifications').insert({
      merchant_id: merchant.id,
      type,
      reference,
      provider: 'qoreid',
      status: result.status,
      provider_response: result.providerResponse,
    })

    await admin.from('merchants').update({
      verification_status: result.status,
      verified_at: result.status === 'verified' ? new Date().toISOString() : null,
    }).eq('id', merchant.id)

    if (result.status === 'failed') {
      return { error: 'We could not verify those details. Double-check them and try again.' }
    }

    return { result: 'verified' as const }
  } catch {
    await admin.from('merchants').update({ verification_status: 'failed' }).eq('id', merchant.id)
    return { error: 'Verification service is unavailable right now. Try again shortly.' }
  }
}
