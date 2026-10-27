"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { IconCheck, IconLock } from "@tabler/icons-react";
import { fadeUp, staggerContainer, viewport } from "../lib/motion";
import { discountedMonthly, formatNaira, Interval, monthlyPrice, planDiscountPercent, PLANS, planSignupUrl } from "@/lib/plans";
import { PlanComparison } from "./PlanComparison";

const DISCOUNT = planDiscountPercent();

export function Pricing() {
  const [interval, setInterval] = useState<Interval>("monthly");
  const annual = interval === "annual";
  // The beta discount only applies to the first month of a monthly plan.
  const off = annual ? 0 : DISCOUNT;

  return (
    <section className="py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 md:px-8">
        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mx-auto mb-4 max-w-[640px] text-center"
        >
          <motion.span
            variants={fadeUp}
            className="mb-3 block text-[12.5px] font-bold uppercase tracking-widest text-pepper-600"
          >
            Pricing
          </motion.span>
          <motion.h1 variants={fadeUp} className="mb-5 font-display text-2xl font-bold leading-tight sm:text-3xl md:text-5xl">
            Pick a plan that fits your store.
          </motion.h1>
          <motion.p variants={fadeUp} className="text-[15px] leading-relaxed text-ink-soft sm:text-[16px]">
            Every plan gets a fully branded storefront, WhatsApp ordering, and Nigeria-first checkout. Higher plans
            unlock more stores, more products and deeper customization — every limit is listed below.
          </motion.p>
        </motion.div>

        {DISCOUNT > 0 && (
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="mx-auto mb-6 w-fit max-w-full rounded-2xl bg-palm-50 sm:rounded-full px-4 py-1.5 text-center text-[13px] font-medium text-palm-600"
          >
            Beta offer: {DISCOUNT}% off your first month on any monthly plan
          </motion.p>
        )}

        {/* Billing toggle */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mb-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:mb-14"
        >
          <span className={`text-sm font-medium ${!annual ? "text-ink" : "text-ink-soft"}`}>Monthly</span>
          <button
            role="switch"
            aria-checked={annual}
            aria-label="Bill annually"
            onClick={() => setInterval(annual ? "monthly" : "annual")}
            className="relative h-7 w-13 rounded-full bg-indigo-900 transition-colors"
          >
            <span
              className="absolute top-1 h-5 w-5 rounded-full bg-marigold-500 transition-all"
              style={{ left: annual ? "30px" : "4px" }}
            />
          </button>
          <span className={`text-sm font-medium ${annual ? "text-ink" : "text-ink-soft"}`}>
            Annual <span className="text-palm-600">— 2 months free</span>
          </span>
        </motion.div>

        {/* Plan cards */}
        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="grid items-start gap-6 md:grid-cols-3"
        >
          {PLANS.map((plan) => {
            const price = monthlyPrice(plan, interval);
            return (
              <motion.div
                key={plan.id}
                variants={fadeUp}
                className={`relative flex min-w-0 flex-col rounded-2xl border p-5 sm:p-7 ${
                  plan.featured
                    ? "border-indigo-600 bg-white shadow-[0_20px_60px_-20px_rgba(42,59,143,0.35)] md:-translate-y-3"
                    : "border-sand-300 bg-paper"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                )}

                <h3 className="mb-1.5 font-display text-xl font-bold">{plan.name}</h3>
                <p className="mb-6 min-h-[38px] text-[13.5px] text-ink-soft">{plan.tagline}</p>

                <div className="mb-1 flex flex-wrap items-baseline gap-x-1.5">
                  {off > 0 && (
                    <s className="text-lg font-semibold text-ink-soft/70 decoration-pepper-600 decoration-2">
                      <span className="sr-only">Was </span>
                      {formatNaira(price)}
                    </s>
                  )}
                  <span className="font-display text-3xl font-bold sm:text-4xl">
                    {formatNaira(off > 0 ? discountedMonthly(plan, off) : price)}
                  </span>
                  <span className="text-sm text-ink-soft">{off > 0 ? "first month" : "/mo"}</span>
                </div>
                <p className="mb-6 text-xs text-ink-soft">
                  {annual
                    ? `Billed ${formatNaira(price * 12)} annually`
                    : off > 0
                      ? `Then ${formatNaira(price)}/mo, billed monthly`
                      : "Billed monthly"}
                </p>

                {/* Headline limits */}
                <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-sand-200 bg-sand-200">
                  {plan.limits.map((l) => (
                    <div key={l.label} className="bg-sand-100 px-3 py-2.5">
                      <dd className="font-display text-lg font-bold leading-tight">{l.value}</dd>
                      <dt className="text-[11.5px] text-ink-soft">{l.label}</dt>
                    </div>
                  ))}
                </dl>

                <ul className="mb-4 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[14px] text-ink">
                      <IconCheck size={16} className="mt-0.5 shrink-0 text-palm-600" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.locked.length > 0 && (
                  <ul className="mb-8 space-y-2 border-t border-dashed border-sand-300 pt-4">
                    {plan.locked.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[13.5px] text-ink/45">
                        <IconLock size={15} className="mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex-1" />

                <Link
                  href={planSignupUrl(plan.id, interval)}
                  className={`rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors ${
                    plan.featured
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-sand-100 text-ink hover:bg-sand-200"
                  }`}
                >
                  Get {plan.name}
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        <PlanComparison />

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mx-auto mt-12 max-w-[640px] text-center text-[13px] text-ink-soft"
        >
          Prices are in Naira and exclude any bank or payment provider fees on transactions your customers make
          directly to you. No setup fees, cancel anytime.
        </motion.p>
      </div>
    </section>
  );
}