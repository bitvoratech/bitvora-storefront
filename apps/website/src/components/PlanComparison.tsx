"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { IconCheck, IconMinus } from "@tabler/icons-react";
import { fadeUp, viewport } from "../lib/motion";
import { Cell, COMPARISON, PLANS } from "@/lib/plans";


function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <>
        <IconCheck size={18} className="mx-auto text-palm-600" aria-hidden />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <IconMinus size={18} className="mx-auto text-ink/25" aria-hidden />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="text-[13.5px] font-medium">{value}</span>;
}

export function PlanComparison() {
  // Phones show one plan column at a time (picked below) instead of a table
  // that silently scrolls sideways. Starts on the featured plan.
  const [mobilePlan, setMobilePlan] = useState(Math.max(0, PLANS.findIndex((p) => p.featured)));
  const col = (i: number) => (i === mobilePlan ? "" : "hidden sm:table-cell");

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      className="mt-20 sm:mt-28"
    >
      <div className="mx-auto mb-8 max-w-[560px] text-center">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Compare every plan</h2>
        <p className="mt-2 text-[14.5px] text-ink-soft">Exactly what you get, and where each limit sits.</p>
      </div>

      <div
        className="sm:hidden mb-3 grid grid-cols-3 gap-1 rounded-xl bg-sand-100 p-1"
        role="group"
        aria-label="Choose a plan to compare"
      >
        {PLANS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setMobilePlan(i)}
            aria-pressed={i === mobilePlan}
            className={`rounded-lg py-2 text-[14px] font-semibold transition-colors ${
              i === mobilePlan ? "bg-white text-indigo-600 shadow-sm" : "text-ink-soft"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-sand-300">
        <table className="w-full sm:min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-sand-300 bg-sand-100">
              <th scope="col" className="w-[40%] px-4 py-4 text-[13px] font-semibold text-ink-soft sm:px-5">
                <span className="sr-only">Feature</span>
              </th>
              {PLANS.map((p, i) => (
                <th
                  key={p.id}
                  scope="col"
                  className={`${col(i)} px-3 py-4 text-center font-display text-base font-bold ${
                    p.featured ? "bg-indigo-50 text-indigo-600" : ""
                  }`}
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          {COMPARISON.map((group) => (
            <tbody key={group.group}>
              <tr>
                <th
                  colSpan={4}
                  scope="colgroup"
                  className="bg-paper-dim px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-widest text-ink-soft sm:px-5"
                >
                  {group.group}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.label} className="border-t border-sand-200">
                  <th scope="row" className="px-4 py-3 text-[14px] font-normal sm:px-5">
                    {row.label}
                  </th>
                  {row.values.map((v, i) => (
                    <td
                      key={PLANS[i].id}
                      className={`${col(i)} px-3 py-3 text-center ${PLANS[i].featured ? "bg-indigo-50/50" : ""}`}
                    >
                      <CellValue value={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </motion.div>
  );
}