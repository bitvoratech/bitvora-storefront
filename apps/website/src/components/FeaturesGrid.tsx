import { Storefront, MobileMoney, Waybill, AiSpark, Wallet, Users } from 'switch-icons'

const FEATURES = [
  {
    icon: Storefront,
    title: 'Your brand, not a template',
    description: 'Pick your own colors and hero sections — customers see your store, not a generic layout.',
  },
  {
    icon: MobileMoney,
    title: 'WhatsApp-native ordering',
    description: 'Customers can order straight to WhatsApp with the cart and details pre-filled.',
  },
  {
    icon: Waybill,
    title: 'Nigeria-first checkout',
    description: 'Bank transfer, pay on delivery, and delivery fees you set for every area you serve.',
  },
  {
    icon: AiSpark,
    title: 'Fast by default',
    description: 'Built on modern web tech so your store loads quickly, even on a budget phone.',
  },
  {
    icon: Wallet,
    title: 'Real order management',
    description: 'See every order, update status, and track payment proof — all from one dashboard.',
  },
  {
    icon: Users,
    title: 'Built for how you sell',
    description: 'Designed around Nigerian small businesses — not adapted from a Western template.',
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-6 py-14 sm:py-20">
      <div className="text-center mb-14 max-w-xl mx-auto">
        <h2 className="font-display font-semibold text-3xl sm:text-4xl mb-3">
          Everything your store needs
        </h2>
        <p className="text-ink/50">
          No plugins, no bolt-ons — just what a growing Nigerian business actually uses.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="border border-sand-200 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
              <feature.icon className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="font-display font-medium text-lg mb-1.5">{feature.title}</p>
            <p className="text-sm text-ink/60 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}