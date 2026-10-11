'use client'

import Link from 'next/link'
import { IconBrandInstagram, IconBrandTiktok, IconBrandX, IconBrandWhatsapp } from '@tabler/icons-react'
import { motion } from 'motion/react'
import { AdireStrip } from './AdireStrip'
import { fadeUp, staggerContainer, viewport } from '../lib/motion'
import { ADMIN_URL } from '../lib/plans'

const SOCIALS = [
  { Icon: IconBrandX, label: 'X (Twitter)' },
  { Icon: IconBrandInstagram, label: 'Instagram' },
  { Icon: IconBrandTiktok, label: 'TikTok' },
  { Icon: IconBrandWhatsapp, label: 'WhatsApp' },
]

export function PremiumFooter() {
  return (
    <footer className="bg-indigo-950 text-paper relative overflow-hidden">
      {/* Same light the hero opened with, breathing slowly — this is the
          actual last thing on the page, so the callback belongs here. */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 25% 10%, rgba(231,160,56,0.12), transparent 55%)",
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <AdireStrip dark />
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-14 sm:py-20 relative">
        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="grid md:grid-cols-[1.3fr_1fr] gap-12 mb-16"
        >
          <motion.div variants={fadeUp}>
            <h2 className="mb-4 font-display text-4xl font-bold leading-tight md:text-5xl">
              Get pro <span className="text-marigold-500">support.</span>
            </h2>
            <p className="mb-7 max-w-[460px] text-[15px] leading-relaxed text-paper/65">
              We&apos;re here to help. If you need assistance switching from your current setup, have questions about whether Bitvora Storefront fits your business, or want help getting started, talk to a member of our team.
            </p>
            <Link
              href={`${ADMIN_URL}/signup`}
              className="inline-flex items-center gap-2 rounded-lg bg-marigold-500 px-5 py-3 text-[14.5px] font-semibold text-indigo-950 transition hover:-translate-y-px"
            >
              Get started →
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col gap-6 sm:gap-8 text-[13.5px] md:mx-auto">
            <div className='flex flex-col'>
              <p className="mb-1.5 text-paper/50">WhatsApp</p>
              {/* Tappable on phones: opens a WhatsApp chat */}
              <a href="https://wa.me/2349038679199" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                +234 903 867 9199
              </a>
            </div>
            <div>
              <p className="mb-1.5 text-paper/50">Email</p>
              <a href="mailto:help@bitvorastorefront.com" className="font-semibold hover:underline break-all">
                help@bitvorastorefront.com
              </a>
            </div>
            <div>
              <p className="mb-1.5 text-paper/50">Address</p>
              <p className="font-semibold">Dacosta Yaba, Lagos, Nigeria</p>
            </div>
            <div className="col-span-2 md:mx-auto">
              <motion.div
                variants={staggerContainer(0.06)}
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                className="flex items-center gap-10 "
              >
                {SOCIALS.map(({ Icon, label }) => (
                  <motion.div key={label} variants={fadeUp}>
                    <motion.span
                      whileHover={{ scale: 1.18, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="block"
                    >
                      <Icon
                        size={20}
                        aria-label={label}
                        className="text-paper/70 hover:text-paper transition-colors cursor-pointer"
                      />
                    </motion.span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="border-t border-paper/10 pt-8"
        >
          <p className="mb-6 max-w-[820px] text-[13px] leading-relaxed text-paper/50">
            Bitvora Storefront is a Bitvoratech product built to empower Nigerian businesses with storefronts that look like their brand — WhatsApp ordering, Naira pricing, and delivery on your own terms, all in one place.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-[13px] text-paper/50">
            <span>© {new Date().getFullYear()} Bitvoratech. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-paper transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-paper transition-colors">Privacy</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}