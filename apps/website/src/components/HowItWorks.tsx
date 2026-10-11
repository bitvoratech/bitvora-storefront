const STEPS = [
  { number: '01', title: 'Create your store', description: 'Sign up and name your store in under a minute.' },
  { number: '02', title: 'Set your brand', description: 'Pick your accent color and build your homepage hero.' },
  { number: '03', title: 'Add your products', description: 'Upload photos, set prices, and organize by category.' },
  { number: '04', title: 'Go live', description: 'Publish and start taking real orders — WhatsApp, transfer, or on delivery.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-sand-100/50 py-14 sm:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14 max-w-xl mx-auto">
          <h2 className="font-display font-semibold text-3xl sm:text-4xl mb-3">
            Live in four steps
          </h2>
          <p className="text-ink/50">From signup to your first sale, no developer needed.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step) => (
            <div key={step.number}>
              <p className="font-mono text-marigold-500 font-semibold text-sm mb-2">{step.number}</p>
              <p className="font-display font-medium text-lg mb-1.5">{step.title}</p>
              <p className="text-sm text-ink/60 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}