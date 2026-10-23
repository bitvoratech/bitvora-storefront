// The About section's config lives in sections.config (jsonb), so new fields
// need no migration. Older rows only have heading + body; everything else is
// optional and read defensively, since merchants (and old code) wrote it.

export const ABOUT_LIMITS = {
  heading: 60,
  body: 1200,
  highlight: 40,
  highlights: 3,
} as const

export type AboutConfig = {
  heading: string
  body: string
  image_url: string
  highlights: string[]
}

export function normalizeAbout(raw: unknown): AboutConfig {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  const image = str(c.image_url).trim()
  return {
    heading: str(c.heading).trim().slice(0, ABOUT_LIMITS.heading),
    // Keep the merchant's line breaks; only trim the ends.
    body: str(c.body).replace(/\r\n/g, '\n').trim().slice(0, ABOUT_LIMITS.body),
    image_url: /^https:\/\//.test(image) ? image : '',
    highlights: (Array.isArray(c.highlights) ? c.highlights : [])
      .map((h) => str(h).trim().slice(0, ABOUT_LIMITS.highlight))
      .filter(Boolean)
      .slice(0, ABOUT_LIMITS.highlights),
  }
}

/** A blank line starts a new paragraph; single line breaks stay inside one. */
export function aboutParagraphs(body: string): string[] {
  return body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
}

/** Nothing to show: the storefront hides the section entirely. */
export function isAboutEmpty(a: AboutConfig) {
  return !a.heading && !a.body
}
