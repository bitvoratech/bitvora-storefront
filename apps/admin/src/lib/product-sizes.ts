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

/**
 * Cleans the per-size prices: keeps only sizes the product has (in the
 * product's spelling), drops blanks, and rounds to kobo. A size left out
 * uses the product's own price. Matches products_size_prices_shape.
 */
export function normalizeSizePrices(
  input: unknown,
  sizes: string[],
): { ok: true; sizePrices: Record<string, number> } | { ok: false; error: string } {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Invalid size prices.' }
  }
  const byKey = new Map(sizes.map((s) => [s.toLowerCase(), s]))
  const sizePrices: Record<string, number> = {}
  for (const [rawSize, rawPrice] of Object.entries(input as Record<string, unknown>)) {
    const size = byKey.get(rawSize.trim().replace(/\s+/g, ' ').toLowerCase())
    if (!size) continue
    if (rawPrice === null || rawPrice === '' || rawPrice === undefined) continue
    const price = Number(rawPrice)
    if (!Number.isFinite(price) || price <= 0 || price > 100_000_000) {
      return { ok: false, error: `Enter a valid price for size ${size}, or leave it blank.` }
    }
    sizePrices[size] = Math.round(price * 100) / 100
  }
  return { ok: true, sizePrices }
}

/** The price for a size: its own price when the merchant set one. */
export function priceForSize(price: number, sizePrices: Record<string, number> | null | undefined, size: string | null) {
  const own = size ? Number(sizePrices?.[size]) : NaN
  return Number.isFinite(own) && own > 0 ? own : price
}
