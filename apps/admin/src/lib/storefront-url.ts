/**
 * Public URL of a store, or null when NEXT_PUBLIC_STOREFRONT_URL isn't set
 * outside development — better to hide links than send merchants to localhost.
 */
export function storefrontUrl(slug: string): string | null {
  const base =
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '')
  if (!base) return null
  return `${base.replace(/\/+$/, '')}/${slug}`
}
