import { Nav } from './Nav'
import { PremiumFooter } from './PremiumFooter'

export function LegalLayout({
  title,
  updatedDate,
  children,
}: {
  title: string
  updatedDate: string
  children: React.ReactNode
}) {
  return (
    <main className="bg-paper text-ink">
      <Nav />
      <div className="mx-auto max-w-[760px] px-5 sm:px-8 py-14 sm:py-20">
        <h1 className="mb-2 font-display text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="mb-12 text-[13.5px] text-ink-soft">Last updated: {updatedDate}</p>
        <div className="prose-legal space-y-8">{children}</div>
      </div>
      <PremiumFooter />
    </main>
  )
}