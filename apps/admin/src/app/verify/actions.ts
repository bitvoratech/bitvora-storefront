'use server'

import { createHash, randomInt, timingSafeEqual } from 'crypto'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { normalizeNigerianPhone, sendSms } from '../../lib/termii'
import { normalizeCac, normalizeNin } from '../../lib/merchant-identity'
import { rateLimit } from '@bitvora/lib/rate-limit' 

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

export async function requestPhoneOtp(prevState: { error?: string; sent?: boolean; phone?: string } | undefined, formData: FormData) {
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
  if (byMerchant.unavailable || byPhone.unavailable) {
    return { error: 'Verification is temporarily unavailable. Try again in a few minutes.' }
  }
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
  } catch (err) {
    // Don't leave a code the merchant never received as the "pending" one.
    await admin.from('merchant_otps').update({ consumed_at: new Date().toISOString() }).eq('merchant_id', merchant.id).is('consumed_at', null)
    console.error('OTP SMS failed', err)
    return { error: 'Could not send SMS right now. Try again in a moment.' }
  }

  return { sent: true, phone }
}

export async function confirmPhoneOtp(prevState: { error?: string; verified?: boolean; submitted?: boolean } | undefined, formData: FormData) {
  const { admin, merchant } = await getMerchant()

  const code = (formData.get('code') as string || '').trim()
  if (!code) return { error: 'Enter the code we sent you.' }
  if (!/^\d{6}$/.test(code)) return { error: 'The code is 6 digits.' }

  const rl = await rateLimit('otp-confirm', merchant.id, 10, '10 m', { failOpen: false })
  if (rl.unavailable) return { error: 'Verification is temporarily unavailable. Try again in a few minutes.' }
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

  // NIN and CAC were given at signup, so with the phone verified the details
  // go straight to the owner's review queue.
  const submitted = await submitForReviewIfComplete(admin, merchant.id)
  return { verified: true, submitted }
}

type AdminClient = ReturnType<typeof createAdminClient>

async function submitForReviewIfComplete(admin: AdminClient, merchantId: string) {
  const { data } = await admin
    .from('merchants')
    .update({ verification_status: 'pending', verification_submitted_at: new Date().toISOString() })
    .eq('id', merchantId)
    .eq('verification_status', 'unverified')
    .not('nin', 'is', null)
    .not('cac_number', 'is', null)
    .not('phone_verified_at', 'is', null)
    .select('id')
  return !!data?.length
}

// For merchants who signed up before NIN/CAC were collected at signup, or
// whose details an owner rejected: (re)submit them for manual review.
export async function submitIdentityDetails(
  prevState: { error?: string; submitted?: boolean } | undefined,
  formData: FormData
) {
  const { admin, merchant } = await getMerchant()

  if (merchant.verification_status === 'verified') redirect('/stores/new')
  if (!merchant.phone_verified_at) return { error: 'Verify your phone number first.' }

  const rl = await rateLimit('identity', merchant.id, 5, '1 h', { failOpen: false })
  if (rl.unavailable) return { error: 'Verification is temporarily unavailable. Try again in a few minutes.' }
  if (!rl.ok) return { error: 'Too many attempts. Try again later.' }

  const businessName = ((formData.get('businessName') as string) || '').trim()
  const nin = normalizeNin(formData.get('nin') as string)
  const cac = normalizeCac(formData.get('cac') as string)

  if (businessName.length < 2 || businessName.length > 200) {
    return { error: 'Enter your business name as registered with CAC.' }
  }
  if (!nin) return { error: 'NIN must be 11 digits.' }
  if (!cac) return { error: 'Enter a valid CAC number, e.g. RC123456 or BN1234567.' }

  const { error } = await admin.from('merchants').update({
    business_name: businessName,
    nin,
    cac_number: cac,
    verification_status: 'pending',
    verification_submitted_at: new Date().toISOString(),
    verification_note: null,
  }).eq('id', merchant.id)
  if (error) return { error: 'Could not save your details. Try again.' }

  return { submitted: true }
}
