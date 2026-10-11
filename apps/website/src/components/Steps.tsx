"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { fadeUp, staggerContainer, viewport } from "../lib/motion";

const STEPS = [
  {
    num: "01",
    title: "Create your store",
    body: "Sign up and name your store in under a minute.",
  },
  {
    num: "02",
    title: "Set your brand",
    body: "Pick your accent color and build your homepage hero.",
  },
  {
    num: "03",
    title: "Add your products",
    body: "Upload photos, set prices, and organize by category.",
  },
  {
    num: "04",
    title: "Go live",
    body: "Publish and start taking real orders — WhatsApp, transfer, or on delivery.",
  },
];

function Step({
  step,
  index,
  progress,
}: {
  step: (typeof STEPS)[number];
  index: number;
  progress: MotionValue<number>;
}) {
  const start = index / STEPS.length;
  const end = start + 1 / STEPS.length + 0.05;
  const opacity = useTransform(progress, [start, end], [0.25, 1]);
  const y = useTransform(progress, [start, end], [16, 0]);
  const ringColor = useTransform(progress, [start, end], ["#D9CBAE", "#E7A038"]);

  return (
    <motion.div className="relative" style={{ opacity, y }}>
      <motion.div
        className="relative z-[1] mb-4.5 flex h-[31px] w-[31px] items-center justify-center rounded-full border-2 bg-paper-dim font-mono text-[13px] font-semibold text-indigo-900"
        style={{ borderColor: ringColor }}
      >
        {step.num}
      </motion.div>
      <h3 className="mb-2 text-[16.5px] font-semibold">{step.title}</h3>
      <p className="text-[13.5px] leading-relaxed text-ink-soft">{step.body}</p>
    </motion.div>
  );
}

export function Steps() {
  const trackRef = useRef<HTMLDivElement>(null);

  // Single source of truth for the whole sequence: as this row scrolls
  // through view, everything below reads off the same progress value, so
  // the line and the steps it "lights up" are mathematically locked together
  // rather than just eyeballed to look close.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.75", "end 0.4"],
  });

  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="how-it-works" className="bg-paper-dim py-16 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mx-auto mb-14 max-w-[560px] text-center"
        >
          <motion.span
            variants={fadeUp}
            className="mb-3 block text-[12.5px] font-bold uppercase tracking-widest text-pepper-600"
          >
            The signup flow
          </motion.span>
          <motion.h2 variants={fadeUp} className="mb-3.5 font-display text-3xl font-bold md:text-4xl">
            Live in four steps
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[16px] leading-relaxed text-ink-soft">
            From signup to your first sale, no developer needed.
          </motion.p>
        </motion.div>

        <div ref={trackRef} className="relative grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Dashed connector — draws left to right as the row scrolls into view */}
          <div
            aria-hidden
            className="absolute left-[6%] right-[6%] top-[15px] hidden h-px md:block"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #D9CBAE 0 6px, transparent 6px 12px)",
            }}
          />
          <motion.div
            aria-hidden
            className="absolute left-[6%] right-[6%] top-[15px] hidden h-px origin-left md:block"
            style={{
              scaleX: lineScale,
              backgroundImage:
                "repeating-linear-gradient(90deg, #E7A038 0 6px, transparent 6px 12px)",
            }}
          />

          {STEPS.map((step, index) => (
            <Step key={step.num} step={step} index={index} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}