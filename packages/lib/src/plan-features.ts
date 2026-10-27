// What each plan unlocks in the storefront editor, matching the comparison
// table on the pricing page (apps/website/src/lib/plans.ts). Starter gets the
// brand color, logo, homepage hero and social links; Growth and Pro get the
// rest. The database holds merchants to this too (plan_has_full_customization
// in the plan_features migration), and the storefront renders a Starter store
// without Growth settings, so a store that saved them before (or downgraded)
// still looks like a Starter store.

/** Homepage sections a Starter store can have. */
export const STARTER_SECTION_TYPES = ['hero'] as const

export const DEFAULT_TYPOGRAPHY = { pairing: 'editorial', scale: 'standard' } as const
export const DEFAULT_GRID_DENSITY = 3

/**
 * Whether a plan includes full homepage customization: about, collections,
 * closing banner, fonts, heading size, grid and showing/hiding/reordering
 * sections. No plan on record counts as Starter.
 */
export function hasFullCustomization(plan: string | null | undefined): boolean {
  return plan === 'growth' || plan === 'pro'
}

/** Whether a section type can be edited or shown on this plan. */
export function sectionAllowed(plan: string | null | undefined, type: string): boolean {
  return hasFullCustomization(plan) || (STARTER_SECTION_TYPES as readonly string[]).includes(type)
}
