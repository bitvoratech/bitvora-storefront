'use client'

import { useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'motion/react'
import { fadeUp, staggerContainer, viewport, EASE } from '../lib/motion'

export type FaqItem = { q: string; a: string }

const FAQS: FaqItem[] = [
  { q: 'Do I need to know how to code?', a: 'No. Bitvora Stores is built for non-technical merchants — you customize your store visually, no code required.' },
  { q: 'Can customers order via WhatsApp?', a: 'Yes. Every product has a built-in "Order via WhatsApp" option that pre-fills the customer\'s message with product details.' },
  { q: 'What payment methods are supported?', a: 'Customers pay by bank transfer or pay-on-delivery, straight to the merchant.' },
  { q: 'Can I use my own domain?', a: 'Custom domains are on our roadmap. Right now, your store gets a Bitvora Stores link you can share anywhere.' },
  { q: 'Is there a free plan?', a: 'No. Every Bitvora Stores plan is paid, and each plan\'s limits are listed on the pricing page.' },
]

export function FAQ({ items = FAQS }: { items?: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="mx-auto max-w-[760px] px-5 sm:px-8">
        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mx-auto mb-12 max-w-[560px] text-center"
        >
          <motion.span
            variants={fadeUp}
            className="mb-3 block text-[12.5px] font-bold uppercase tracking-widest text-pepper-600"
          >
            Questions
          </motion.span>
          <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold md:text-4xl">
            Frequently asked questions
          </motion.h2>
        </motion.div>

        <motion.div
          variants={staggerContainer(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="space-y-3"
        >
          {items.map((item, i) => {
            const isOpen = open === i
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                className="rounded-xl border border-sand-300 bg-paper overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-medium text-[15px]">{item.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="shrink-0 text-ink-soft"
                  >
                    <IconChevronDown size={18} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 text-[14px] leading-relaxed text-ink-soft">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}