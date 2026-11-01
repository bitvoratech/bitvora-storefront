import type { MetadataRoute } from 'next'

// Stores are public so sellers get found on Google. Private pages (cart,
// checkout, orders, API) are kept out with an X-Robots-Tag header in
// next.config.ts instead of being listed here, since robots.txt is public.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' } }
}
