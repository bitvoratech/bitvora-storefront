// Sizes are typed by the merchant ("16 inches", "42", "XL", "3 feet"), never
// picked from a preset list. These limits match the products_sizes_limit and
// order_items.size checks in the database.
export const MAX_SIZES = 30
export const MAX_SIZE_LENGTH = 40

/** Splits what the merchant typed into sizes: "S, M, L" adds three. */
export function splitSizes(text: string): string[] {
  return text.split(',').map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean)
}

/**
 * Cleans a list of sizes: trims, drops blanks and repeats (ignoring case,
 * keeping the first spelling). Returns an error message for anything the
 * database would refuse.
 */
export function normalizeSizes(input: unknown): { ok: true; sizes: string[] } | { ok: false; error: string } {
  if (!Array.isArray(input) || !input.every((s) => typeof s === 'string')) {
    return { ok: false, error: 'Invalid sizes.' }
  }
  const seen = new Set<string>()
  const sizes: string[] = []
  for (const raw of input as string[]) {
    const size = raw.trim().replace(/\s+/g, ' ')
    if (!size) continue
    if (size.length > MAX_SIZE_LENGTH) {
      return { ok: false, error: `Keep each size under ${MAX_SIZE_LENGTH} characters.` }
    }
    const key = size.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    sizes.push(size)
  }
  if (sizes.length > MAX_SIZES) {
    return { ok: false, error: `You can add up to ${MAX_SIZES} sizes.` }
  }
  return { ok: true, sizes }
}
