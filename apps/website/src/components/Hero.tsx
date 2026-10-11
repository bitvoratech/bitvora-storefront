"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { AdireStrip } from "./AdireStrip";
import { fadeUp, staggerContainer, EASE } from "../lib/motion";
import { hexToRgba, getContrastText } from "../lib/color";
import { ADMIN_URL, PLANS } from "../lib/plans";

const SWATCHES = [
  { name: "pepper", hex: "#A73A3F" },
  { name: "mint", hex: "#b7e4c7" },
  { name: "marigold", hex: "#E7A038" },
  { name: "palm", hex: "#3E6E52" },
  { name: "teal", hex: "#2E7B8C" },
];

const PRODUCTS = [
  { name: "Woven Raffia Tote", meta: "₦18,500 · 12 in stock" },
  { name: "Adire Wrap Skirt", meta: "₦24,000 · 6 in stock" },
];

const DURATION_LONG = 0.7;
const COLOR_TRANSITION = { duration: 0.45, ease: EASE };

export function Hero() {
  const [activeSwatch, setActiveSwatch] = useState(2); // starts on marigold
  const [published, setPublished] = useState(true);

  const accent = SWATCHES[activeSwatch].hex;
  const accentText = getContrastText(accent);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900 to-indigo-950 text-paper">
      {/* Top glow — tracks the picked accent instead of being fixed marigold */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background: `radial-gradient(ellipse at 78% 0%, ${hexToRgba(accent, 0.14)}, transparent 55%)`,
        }}
        transition={COLOR_TRANSITION}
      />

      <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-10 px-5 sm:px-8 py-14 sm:py-20 md:grid-cols-[1.05fr_0.95fr] md:py-28">
        {/* Copy — rendered visible from the server (initial={false}): this is
            the page's main content, so it shouldn't wait on JavaScript to
            fade in, especially on mobile data. */}
        <motion.div
          variants={staggerContainer(0.12)}
          initial={false}
          animate="show"
        >
          <motion.span
            variants={fadeUp}
            animate={{
              borderColor: hexToRgba(accent, 0.3),
              backgroundColor: hexToRgba(accent, 0.1),
              color: accent,
            }}
            transition={COLOR_TRANSITION}
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold tracking-wide"
          >
            ● A Bitvoratech product
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mb-6 max-w-[600px] font-display text-4xl font-bold leading-[1.05] md:text-[56px]"
          >
            Storefronts that look like your brand,{" "}
            <motion.span animate={{ color: accent }} transition={COLOR_TRANSITION}>
              not a template.
            </motion.span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mb-8 max-w-[460px] text-[17px] leading-relaxed text-paper/70"
          >
            Build a fast, beautiful online store made for how Nigerians
            actually sell — WhatsApp orders, Naira pricing, your own delivery fees,
            no code required.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mb-10 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-3.5"
          >
            <motion.div
              animate={{ backgroundColor: accent }}
              whileHover={{ boxShadow: `0 6px 18px ${hexToRgba(accent, 0.35)}` }}
              transition={COLOR_TRANSITION}
              // Base colour in plain CSS so the button is visible before JS
              // loads; motion animates it from here when the swatch changes.
              style={{ color: accentText, backgroundColor: accent }}
              className="rounded-lg"
            >
              <Link
                href={`${ADMIN_URL}/signup`}
                className="block rounded-lg px-5 py-3.5 sm:py-3 text-center text-[15px] sm:text-[14.5px] font-semibold transition hover:-translate-y-px"
              >
                Start your store
              </Link>
            </motion.div>
            <Link
              href="#how-it-works"
              className="rounded-lg border border-paper/30 px-5 py-3.5 sm:py-3 text-center text-[15px] sm:text-[14.5px] font-semibold transition hover:-translate-y-px"
            >
              See how it works
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="grid grid-cols-3 gap-4 sm:gap-7 max-w-[480px] border-t border-paper/15 pt-6"
          >
            {/* Concrete promises rather than vanity counters — no zeros on launch day. */}
            {/* Every plan is paid (see pricing FAQ) — don't imply a free tier. */}
            <Stat value={`₦${PLANS[0].monthly.toLocaleString()}`} label="a month to start" />
            <Stat value="Minutes" label="to launch your store" />
            <Stat value="Verified" label="sellers, NIN/CAC checked" />
          </motion.div>
        </motion.div>

        {/* Visual: real dashboard mockup + floating WhatsApp order — desktop only */}
        <div className="hidden md:block relative h-full md:h-[520px]">
          {/* Decorative blob background — rotates forever, recolors with the accent */}
          <motion.svg
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute -top-30 -right-34 w-[550px] md:w-[750px] opacity-[0.15] pointer-events-none"
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          >
            <motion.path
              animate={{ fill: accent }}
              transition={COLOR_TRANSITION}
              d="M39.8,-68.9C53.2,-61.1,67.1,-53.9,76.4,-42.5C85.7,-31.2,90.4,-15.6,87.8,-1.5C85.1,12.5,75.1,25,66.6,37.9C58.2,50.7,51.3,63.8,40.5,73.4C29.6,82.9,14.8,88.8,0.3,88.3C-14.3,87.9,-28.6,81.1,-40,71.9C-51.3,62.6,-59.7,51,-65.5,38.6C-71.2,26.2,-74.3,13.1,-75.4,-0.6C-76.4,-14.3,-75.4,-28.7,-69.7,-41C-63.9,-53.4,-53.4,-63.8,-41,-72.3C-28.6,-80.7,-14.3,-87.3,-0.6,-86.3C13.1,-85.3,26.3,-76.8,39.8,-68.9Z"
              transform="translate(100 100)"
            />
          </motion.svg>

          {/* Dashboard mockup — lands a beat after the copy, then breathes gently */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 2.5 }}
            animate={{
              opacity: 1,
              y: [0, -6, 0],
              rotate: 2.5,
            }}
            transition={{
              opacity: { duration: DURATION_LONG, ease: EASE, delay: 0.5 },
              y: {
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.1,
              },
            }}
            className="absolute right-0 top-0 w-[300px] overflow-hidden rounded-2xl bg-paper shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] md:w-[420px]"
          >
            <div className="flex items-center gap-1.5 border-b border-sand-300 bg-paper-dim px-3.5 py-2.5">
              <span className="h-2 w-2 rounded-full bg-sand-400" />
              <span className="h-2 w-2 rounded-full bg-sand-400" />
              <span className="h-2 w-2 rounded-full bg-sand-400" />
            </div>

            <div className="p-4.5 text-ink">
              <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-soft">
                Brand accent color
              </p>
              <div className="mb-4.5 flex gap-2">
                {SWATCHES.map((s, i) => (
                  <button
                    key={s.name}
                    aria-label={`Use ${s.name} as brand accent`}
                    onClick={() => setActiveSwatch(i)}
                    className="h-6.5 w-6.5 rounded-md transition"
                    style={{
                      background: s.hex,
                      boxShadow:
                        i === activeSwatch
                          ? "0 0 0 2px var(--color-paper), 0 0 0 3.5px var(--color-indigo-900)"
                          : "none",
                    }}
                  />
                ))}
              </div>

              <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-soft">
                Products
              </p>
              {PRODUCTS.map((p) => (
                <div
                  key={p.name}
                  className="mb-2 flex items-center gap-3 rounded-lg bg-paper-dim/60 p-2.5"
                >
                  <div className="h-10.5 w-10.5 flex-shrink-0 rounded-md bg-gradient-to-br from-sand-300 to-paper-dim" />
                  <div>
                    <p className="font-display text-[13px] font-semibold">{p.name}</p>
                    <p className="font-mono text-[11.5px] text-ink-soft">{p.meta}</p>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setPublished((v) => !v)}
                className="mt-3.5 flex w-full items-center justify-between rounded-lg bg-indigo-900 px-3.5 py-3 text-paper"
              >
                <span className="text-[12.5px] font-semibold">
                  {published ? "Store is live" : "Store is unpublished"}
                </span>
                <motion.span
                  className="relative h-[19px] w-[34px] rounded-full"
                  style={{ backgroundColor: published ? accent : "#5B5346" }}
                  animate={{ backgroundColor: published ? accent : "#5B5346" }}
                  transition={COLOR_TRANSITION}
                >
                  <span
                    className="absolute top-0.5 h-3.5 w-3.5 rounded-full bg-indigo-950 transition-all"
                    style={{ left: published ? "17px" : "2px" }}
                  />
                </motion.span>
              </button>
            </div>
          </motion.div>

          {/* WhatsApp order card — arrives last, as if it just came in */}
          <motion.div
            initial={{ opacity: 0, y: 30, x: -10, rotate: -3 }}
            animate={{ opacity: 1, y: 0, x: 0, rotate: -3 }}
            transition={{ duration: DURATION_LONG, ease: EASE, delay: 0.85 }}
            className="absolute bottom-3.5 left-0 w-[190px] rounded-xl bg-paper p-3.5 text-ink shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] md:w-[250px]"
          >
            <div className="mb-2.5 flex items-center gap-2">
              {/* Kept as WhatsApp's own green, not the brand accent — this is
                  a status dot ("new order came in"), not a brand element. */}
              <motion.span
                className="h-2 w-2 rounded-full bg-palm-600"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
              />
              <span className="text-[11px] font-semibold text-ink-soft">
                New order · WhatsApp
              </span>
            </div>
            <div className="mb-2.5 rounded-lg bg-paper-dim p-2.5 text-[12px] leading-relaxed">
              Hi! I&rsquo;d like the{" "}
              <motion.span
                animate={{ color: accent }}
                transition={COLOR_TRANSITION}
                className="font-mono font-medium"
              >
                Woven Raffia Tote
              </motion.span>
              , size — is it available for delivery to Yaba?
            </div>
            <div className="rounded-md bg-palm-600 py-2 text-center text-[12.5px] font-semibold text-white">
              Reply on WhatsApp
            </div>
          </motion.div>
        </div>
      </div>

      <AdireStrip dark />
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <b className="font-display text-[15px] md:text-[21px] text-paper">{value}</b>
      <span className="mt-0.5 text-[12.5px] text-paper/55">{label}</span>
    </div>
  );
}