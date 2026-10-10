import { Inter, Fraunces, Playfair_Display, Sora, Bricolage_Grotesque, Lora } from 'next/font/google'

// Self-hosted via next/font: no render-blocking request to Google, and the
// browser only downloads a display font if the store actually uses it
// (preload is off for those — each store uses just one).
export const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap', preload: false })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap', preload: false })
const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap', preload: false })
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap', preload: false })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap', preload: false })

export const fontVariables = [inter, fraunces, playfair, sora, bricolage, lora].map((f) => f.variable).join(' ')
