import type { MetadataRoute } from 'next'

// The dashboard is behind a login; keep it out of search results.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/' } }
}
