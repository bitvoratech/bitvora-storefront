'use server'

import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'
import { normalizeNigerianPhone } from '../../lib/termii'
import { normalizeCac, normalizeNin } from '../../lib/merchant-identity'
import { getClientIp, rateLimit } from '@bitvora/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type SignupState = {
  error?: string
  checkEmail?: boolean
  // Echoed back so the form keeps what the merchant typed after an error.
  values?: Record<string, string>
}

// Signup runs on the server so the identity details are validated here and
// written with the service role: merchants can't write nin/cac_number or the
// verification columns themselves.
export async function signUp(prevState: SignupState | undefined, formData: FormData): Promise<SignupState> {
  const field = (name: string) => ((formData.get(name) as string) || '').trim()
  const values = {
    fullName: field('fullName'),
    businessName: field('businessName'),
    email: field('email'),
    phone: field('phone'),
    nin: field('nin'),
    cac: field('cac'),
  }
  const fail = (error: string): SignupState => ({ error, values })

  const rl = await rateLimit('signup', await getClientIp(), 5, '10 m')
  if (!rl.ok) return fail('Too many sign-up attempts. Try again in a few minutes.')

  const password = (formData.get('password') as string) || ''

  if (values.fullName.length < 2 || values.fullName.length > 100) return fail('Enter your full name.')
  if (values.businessName.length < 2 || values.businessName.length > 200) {
    return fail('Enter your business name as registered with CAC.')
  }
  if (!EMAIL_RE.test(values.email) || values.email.length > 200) return fail('Enter a valid email address.')
  if (password.length < 6) return fail('Password must be at least 6 characters.')

  let phone: string
  try {
    phone = normalizeNigerianPhone(values.phone)
  } catch {
    return fail('Enter a valid Nigerian phone number.')
  }
  const nin = normalizeNin(values.nin)
  if (!nin) return fail('NIN must be 11 digits.')
  const cac = normalizeCac(values.cac)
  if (!cac) return fail('Enter a valid CAC number, e.g. RC123456 or BN1234567.')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password,
    options: { data: { full_name: values.fullName } },
  })

  if (error) return fail(error.message)
  // With email confirmation on, Supabase answers an existing email with a
  // placeholder user that has no identities instead of an error.
  if (!data.user || data.user.identities?.length === 0) {
    return fail('An account with this email already exists. Log in instead.')
  }

  // The merchants row is created by the on_auth_user_created trigger.
  const { error: updateError } = await createAdminClient()
    .from('merchants')
    .update({ business_name: values.businessName, phone, nin, cac_number: cac })
    .eq('user_id', data.user.id)
  if (updateError) {
    console.error('signup: saving merchant details failed', updateError)
    return fail('Your account was created, but we could not save your details. Log in to finish verification.')
  }

  // No session yet means the project requires email confirmation first.
  if (!data.session) return { checkEmail: true }

  redirect('/verify')
}
