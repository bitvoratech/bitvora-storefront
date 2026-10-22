// Public URL of the marketing site, used for canonical links, the sitemap and
// share images. Baked in at build time like the other NEXT_PUBLIC_ vars.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://stores.bitvoratech.com').replace(/\/$/, '')
