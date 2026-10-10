import { Storefront } from 'switch-icons'

// Stores live at /<slug>; the bare domain has nothing to sell, so it just
// tells visitors how to reach a store instead of showing the Next.js template.
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6 text-center text-[#171717]">
      <div className="max-w-sm">
        <Storefront className="w-8 h-8 mx-auto mb-4 text-[#a3a3a3]" />
        <h1 className="text-xl font-semibold mb-2">Bitvora Storefront</h1>
        <p className="text-sm text-[#737373]">
          Looking for a store? Use the link the seller shared with you.
        </p>
      </div>
    </main>
  )
}
