import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// The Paystack webhook has no session; it checks Paystack's signature instead.
const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/auth/', '/api/paystack/webhook']
const SUSPENDED_PATH = '/suspended'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isPublicPath = PUBLIC_PATHS.some((p) => path.startsWith(p))

  // Redirects must carry any refreshed session cookies, or the user gets
  // logged out when a token refresh coincides with a redirect.
  const redirectTo = (pathname: string, search = '') => {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    url.search = search
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }

  // If the confirmation email's redirect URL isn't allow-listed, Supabase
  // falls back to the Site URL with the code on it; finish signing in there.
  const code = request.nextUrl.searchParams.get('code')
  if (path === '/' && code) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/confirm'
    url.search = ''
    url.searchParams.set('code', code)
    return NextResponse.redirect(url)
  }

  // A reset link that didn't sign anyone in has expired or was already used.
  if (!user && path === '/reset-password') {
    return redirectTo('/forgot-password', '?expired=1')
  }

  // Redirect unauthenticated users away from protected routes
  if (!user && !isPublicPath) {
    return redirectTo('/login')
  }

  // Suspended merchants are confined to /suspended. This also blocks their
  // server actions (which POST to page routes); RLS blocks direct API writes.
  if (user && !isPublicPath) {
    const { data: merchant } = await supabase
      .from('merchants')
      .select('is_suspended')
      .eq('user_id', user.id)
      .single()

    const isSuspended = !!merchant?.is_suspended
    const onSuspendedPage = path.startsWith(SUSPENDED_PATH)

    if (isSuspended && !onSuspendedPage) return redirectTo(SUSPENDED_PATH)
    if (!isSuspended && onSuspendedPage) return redirectTo('/')
  }

  // No separate verification redirect here — a merchant can't create a store
  // (and therefore can't reach any store-scoped route) until an owner approves
  // their NIN/CAC; stores/new and its action (plus RLS) enforce that.

  return supabaseResponse
}