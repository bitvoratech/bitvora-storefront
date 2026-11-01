import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'


export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // robots.txt is skipped so crawlers get the "Disallow: /" file instead of
  // a redirect to the login page (which they treat as "crawl everything").
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}