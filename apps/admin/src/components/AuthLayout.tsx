import Image from 'next/image'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Brand panel — hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-indigo-900)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
        {/* Marigold accent glow */}
        <div
          className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: 'var(--color-marigold-500)' }}
        />

        <div className="relative flex items-center gap-2.5">
          <Image
            src="/brand/icon-dark-bg.svg"
            alt="Bitvora Stores"
            width={120}
            height={30}
            className="h-6 sm:h-7 w-auto shrink-0"
          />
          <p className="font-display font-semibold text-xl text-white">Bitvora Stores</p>
        </div>

        <div className="relative">
          <h2 className="font-display text-4xl font-medium text-white leading-tight mb-4">
            Storefronts that look like your brand,
            <br />
            not a template.
          </h2>
          <p className="text-indigo-200/70 text-base max-w-sm">
            Build, manage, and sell — with a store that actually feels like yours.
          </p>
        </div>

        <p className="relative text-indigo-300/50 text-sm">A Bitvoratech product</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-paper">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}