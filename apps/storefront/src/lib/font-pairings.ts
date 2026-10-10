// CSS variables come from lib/fonts.ts (next/font), set on <html>.
export const DISPLAY_FONTS: Record<string, string> = {
  editorial: 'var(--font-fraunces), serif',
  classic: 'var(--font-playfair), serif',
  modern: 'var(--font-sora), sans-serif',
  playful: 'var(--font-bricolage), sans-serif',
  minimal: 'var(--font-inter), sans-serif',
  warm: 'var(--font-lora), serif',
}

export const SCALE_CLASSES: Record<string, { hero: string; section: string; tile: string; cta: string }> = {
  compact: { hero: 'text-3xl sm:text-4xl', section: 'text-xl sm:text-2xl', tile: 'text-lg', cta: 'text-2xl sm:text-3xl' },
  standard: { hero: 'text-4xl sm:text-6xl', section: 'text-2xl sm:text-3xl', tile: 'text-xl', cta: 'text-3xl sm:text-5xl' },
  bold: { hero: 'text-5xl sm:text-7xl', section: 'text-3xl sm:text-4xl', tile: 'text-2xl', cta: 'text-4xl sm:text-6xl md:text-7xl' },
}