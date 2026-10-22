"use client";

import { motion } from "motion/react";
import { fadeUp, slideInLeft, slideInRight, staggerContainer, viewport } from "../lib/motion";
import { IconArrowRight } from "@tabler/icons-react";

export function About() {
  return (
    <section id="about" className="py-16 sm:py-24">
      <motion.div
        variants={staggerContainer(0.12)}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        className="mx-auto max-w-[1240px] px-5 sm:px-8 grid md:grid-cols-2 gap-12 items-center"
      >
        <motion.div variants={slideInLeft}>
          <span className="mb-3 block text-[12.5px] font-bold uppercase tracking-widest text-pepper-600">
            Who we are
          </span>
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
            Built by a studio that actually ships.
          </h2>
          <p className="text-[16px] leading-relaxed text-ink-soft mb-4">
            Bitvora Stores is built by Bitvoratech, a software studio focused on tools for Nigerian businesses. We didn&apos;t build this by guessing — every feature comes from watching how sellers actually operate: on WhatsApp, on Instagram, at the market.
          </p>
          <p className="text-[16px] leading-relaxed text-ink-soft">
            No investors telling us what matters. Just a product built to solve a real problem for real Nigerian merchants.
          </p>
        </motion.div>
        <motion.div variants={slideInRight} className="rounded-2xl bg-indigo-900 p-10 text-paper">
          <p className="font-display text-2xl font-semibold mb-3 pl-5">Our promise</p>
          <motion.ul
            variants={staggerContainer(0.08)}
            className="space-y-5 text-[14.5px] text-paper/75"
          >
            {[
              "Your store looks like your brand, always.",
              "Built for how Nigerians actually sell.",
              "Fast, honest, and no fake numbers.",
            ].map((line) => (
              <motion.li key={line} variants={fadeUp} className="flex gap-2">
                <span className="text-marigold-500"><IconArrowRight  className="w-5 h-5"  /></span> {line}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </motion.div>
    </section>
  );
}