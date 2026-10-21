import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/signup']
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
  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    url.search = ''
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
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