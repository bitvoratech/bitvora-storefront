"use client";

import { IconCheck, IconX, IconPalette, IconBolt, IconShieldCheck, IconBrandWhatsapp } from '@tabler/icons-react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { fadeUp, slideInLeft, slideInRight, staggerContainer, viewport } from '../lib/motion'

const PILLARS = [
  {
    icon: IconPalette,
    image: '/feature/brand.webp',
    tag: 'Real branding',
    title: 'Your store looks like your business, not a rented template.',
    body: 'Most store builders in Nigeria give every merchant the same layout with a different logo pasted on top. We built Bitvora Stores the other way around: pick your accent color, your font pairing, your hero image, your homepage sections — and the platform disappears behind your brand. Customers see your business. They never see ours.',
  },
  {
    icon: IconBrandWhatsapp,
    image: '/feature/whatsapp.webp',
    tag: 'Sell where you already sell',
    title: 'WhatsApp isn\'t an afterthought — it\'s the default.',
    body: 'Nigerian commerce runs on WhatsApp, and pretending otherwise is why so many "modern" storefronts feel disconnected from how sellers actually operate. Every product on Bitvora Stores has a built-in "Order via WhatsApp" button that auto-fills the product name, price, and quantity into a message — so customers can order the exact same way they already do, just faster.',
  },
  {
    icon: IconBolt,
    image: '/feature/demo.webp',
    tag: 'Built for real conditions',
    title: 'Fast on a budget phone, on a slow connection, in real Lagos traffic.',
    body: 'A lot of storefront builders are engineered for demo videos on fast wifi and flagship phones — not the reality of most Nigerian shoppers. We built Bitvora Stores on modern, statically-rendered web architecture specifically so pages load quickly even on mid-range Android devices and inconsistent mobile data. Speed isn\'t a nice-to-have here, it\'s survival.',
  },
  {
    icon: IconShieldCheck,
    image: '/feature/ai.svg',
    tag: 'No games',
    title: 'Straightforward pricing, real delivery pricing, no invented numbers.',
    body: 'We won\'t show you fake trust badges, invented customer counts, or "4.9 star" ratings with no reviews behind them. What you see is what\'s real: transparent checkout with bank transfer and pay-on-delivery, delivery areas and fees you set yourself, wherever you sell, and a product that tells you honestly what it can and can\'t do yet.',
  },
]

const COMPARISON = [
  { us: 'Real brand customization, not templates', them: 'Generic templates everyone shares' },
  { us: 'WhatsApp ordering built in from day one', them: 'Bolted-on integrations, if any' },
  { us: 'Fast, static-rendered storefronts', them: 'Slow page loads on mobile' },
  { us: 'Transparent, no hidden fees', them: 'Unclear settlement and fee structures' },
]

export function WhyBitvora() {
  return (
    <section className="bg-paper-dim py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mx-auto mb-20 max-w-[680px] text-center"
        >
          <motion.span
            variants={fadeUp}
            className="mb-3 block text-[12.5px] font-bold uppercase tracking-widest text-pepper-600"
          >
            Why Bitvora Stores
          </motion.span>
          <motion.h2 variants={fadeUp} className="mb-5 font-display text-3xl font-bold md:text-5xl leading-tight">
            We didn&apos;t build another generic store builder.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[17px] leading-relaxed text-ink-soft">
            Most storefront platforms in Nigeria were adapted from Western templates, then patched to add Naira pricing and a WhatsApp button. We built Bitvora Stores from the ground up around how Nigerian merchants and customers actually behave — and that difference shows up in every decision below.
          </motion.p>
        </motion.div>

        <div className="space-y-16 md:space-y-24 mb-24">
          {PILLARS.map((pillar, i) => {
            const reversed = i % 2 === 1
            // Text and image slide in from opposite directions, but always
            // toward the same landing point at the same duration/ease as
            // everything else — the rhythm alternates, the timing doesn't.
            const textVariant = reversed ? slideInRight : slideInLeft
            const imageVariant = reversed ? slideInLeft : slideInRight

            return (
              <motion.div
                key={pillar.tag}
                variants={staggerContainer(0.1)}
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                className={`grid md:grid-cols-2 gap-10 items-center ${reversed ? 'md:[&>*:first-child]:order-2' : ''}`}
              >
                <motion.div variants={textVariant}>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-900 text-marigold-500">
                    <pillar.icon size={20} />
                  </div>
                  <span className="mb-2 block text-[12px] font-bold uppercase tracking-widest text-pepper-600">
                    {pillar.tag}
                  </span>
                  <h3 className="mb-4 font-display text-2xl md:text-3xl font-bold leading-tight">
                    {pillar.title}
                  </h3>
                  <p className="text-[15.5px] leading-relaxed text-ink-soft">
                    {pillar.body}
                  </p>
                </motion.div>
                <motion.div variants={imageVariant} className="rounded-2xl flex items-center justify-center">
                  <Image src={pillar.image} alt={pillar.tag} width={700} height={600} className="rounded-xl object-cover" />
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mx-auto max-w-[900px]"
        >
          <motion.h3 variants={fadeUp} className="mb-8 text-center font-display text-2xl font-bold md:text-3xl">
            Side by side, it&apos;s not close.
          </motion.h3>
          <motion.div variants={fadeUp} className="rounded-2xl border border-sand-300 bg-paper overflow-hidden">
            <div className="grid grid-cols-2 border-b border-sand-300">
              <div className="p-4 text-center font-display font-semibold text-indigo-900 border-r border-sand-300">
                Bitvora Stores
              </div>
              <div className="p-4 text-center font-display font-semibold text-ink-soft">
                Typical store builders
              </div>
            </div>
            {COMPARISON.map((row, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`grid grid-cols-2 ${i !== COMPARISON.length - 1 ? 'border-b border-sand-300' : ''}`}
              >
                <div className="p-4 flex items-start gap-2 border-r border-sand-300">
                  <IconCheck size={18} className="text-palm-600 shrink-0 mt-0.5" />
                  <span className="text-[14px] text-ink">{row.us}</span>
                </div>
                <div className="p-4 flex items-start gap-2">
                  <IconX size={18} className="text-pepper-600 shrink-0 mt-0.5" />
                  <span className="text-[14px] text-ink-soft">{row.them}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}