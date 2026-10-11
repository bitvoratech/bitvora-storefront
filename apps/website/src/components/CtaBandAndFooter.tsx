"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { AdireStrip } from "./AdireStrip";
import { fadeUp, staggerContainer, viewport } from "../lib/motion";
import { ADMIN_URL, PLANS } from "../lib/plans";

export function CtaBand() {
  return (
    <>
      <AdireStrip />
      <section
        className="py-16 sm:py-24 text-center text-paper relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(221,161,94,0.12), transparent 55%), var(--color-indigo-950)",
        }}
      >
        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="relative mx-auto max-w-[1240px] px-5 sm:px-8"
        >
          <motion.h2
            variants={fadeUp}
            className="mx-auto mb-4 max-w-[600px] font-display text-3xl font-bold md:text-[38px]"
          >
            Build a store that actually looks like yours.
          </motion.h2>
          <motion.p variants={fadeUp} className="mb-8 text-[16px] text-paper/65">
            No code, no template look. Plans from ₦{PLANS[0].monthly.toLocaleString()} a month.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href={`${ADMIN_URL}/signup`}
              className="inline-block rounded-lg bg-marigold-500 px-6 py-3.5 text-[14.5px] font-semibold text-indigo-950 transition hover:-translate-y-px"
            >
              Start your store
            </Link>
          </motion.div>
        </motion.div>
      </section>
      <AdireStrip dark />
    </>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-[1240px] flex-col items-center gap-2.5 px-5 sm:px-8 py-10 text-[13px] text-ink-soft md:flex-row md:justify-between">
      <div className="flex items-center gap-2.5">
      <Image
        src="/brand/icon-light-bg.svg"
        alt="Bitvora Logo"
        width={120}
        height={30}
        className="h-7 w-auto"
      />
      <span className="flex items-center gap-1.5">
         Bitvora Storefront — a Bitvoratech product
      </span>
      </div>
      <span>© 2026 Bitvoratech. All rights reserved.</span>
    </footer>
  );
}