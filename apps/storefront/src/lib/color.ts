// Merchants pick any brand color, so text on it can't always be white:
// white on a light color (Marigold, pastels) is unreadable.

function luminance(hex: string): number | null {
  const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null
  const full = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1]
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** White or near-black, whichever has more WCAG contrast against `hex`. */
export function readableTextOn(hex: string): '#ffffff' | '#171717' {
  const l = luminance(hex)
  if (l === null) return '#ffffff'
  const onWhite = 1.05 / (l + 0.05)
  const onDark = (l + 0.05) / (0.0091 + 0.05) // #171717's luminance ≈ 0.0091
  return onWhite >= onDark ? '#ffffff' : '#171717'
}
