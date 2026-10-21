import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '../../../lib/supabase/server'

// Where Supabase's confirmation email lands. Signing the merchant in here
// sends them straight on to phone verification instead of the login page.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next') ?? '/verify'
  // Only same-site paths, so the link can't bounce anyone off-site.
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/verify'

  const supabase = await createClient()
  let ok = false
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error
  }

  // The email is confirmed by the time Supabase redirects here; exchanging the
  // code only fails when the link is opened in another browser, so logging in works.
  return NextResponse.redirect(new URL(ok ? next : '/login', origin))
}
