"use client";

import { motion } from "motion/react";
import {
  IconBrandWhatsapp,
  IconBuildingStore,
  IconReceipt2,
  IconBolt,
  IconPackage,
  IconUsers,
} from "@tabler/icons-react";
import { fadeUp, staggerContainer, viewport } from "../lib/motion";

const ORDERS = [
  { name: "Chiamaka Obi", amount: "₦22,000" },
  { name: "Femi Adeyemi", amount: "₦8,500" },
  { name: "Ngozi Eze", amount: "₦34,200" },
];

export function BentoFeatures() {
  return (
    <section id="features" className="py-16 sm:py-24">
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
            Everything your store needs
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="mb-3.5 font-display text-3xl font-bold md:text-4xl"
          >
            No plugins, no bolt-ons.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[16px] leading-relaxed text-ink-soft">
            Just what a growing Nigerian business actually uses — built
            around how you already sell, not adapted from a Western
            template.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer(0.09, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="grid grid-cols-2 gap-4 md:grid-cols-6 md:auto-rows-[132px]"
        >
          {/* Large tile — leads the sequence */}
          <motion.div
            variants={fadeUp}
            className="col-span-2 flex flex-col justify-between rounded-2xl bg-indigo-900 p-6 text-paper md:col-span-3 md:row-span-2"
          >
            <div>
              <IconTile bg="rgba(231,160,56,0.15)" color="#E7A038">
                <IconBrandWhatsapp size={18} />
              </IconTile>
              <h3 className="mb-1.5 text-lg font-semibold">
                WhatsApp-native ordering
              </h3>
              <p className="text-[13.5px] leading-relaxed text-paper/65">
                Customers order straight to WhatsApp with the cart and
                details pre-filled — no app download, no new habit to
                learn.
              </p>
            </div>
            <div className="mt-4 rounded-xl border border-paper/10 bg-paper/5 p-3.5">
              {ORDERS.map((o, i) => (
                <div
                  key={o.name}
                  className={`flex justify-between py-1.5 text-[12.5px] ${
                    i !== ORDERS.length - 1
                      ? "border-b border-dashed border-paper/10"
                      : ""
                  }`}
                >
                  <span>{o.name}</span>
                  <b className="font-mono font-medium text-marigold-500">
                    {o.amount}
                  </b>
                </div>
              ))}
            </div>
          </motion.div>

          <Tile
            icon={<IconBuildingStore size={18} />}
            iconBg="rgba(167,58,63,0.1)"
            iconColor="#A73A3F"
            title="Your brand, not a template"
            body="Pick your own colors and hero sections — customers see your store, not a generic layout."
            className="col-span-2 md:col-span-3 py-2"
          />
          <Tile
            icon={<IconReceipt2 size={18} />}
            iconBg="rgba(62,110,82,0.12)"
            iconColor="#3E6E52"
            title="Nigeria-first checkout"
            body="Bank transfer, pay on delivery, and delivery fees you set for every area you serve."
            className="col-span-2 md:col-span-3"
          />
          <Tile
            icon={<IconBolt size={18} />}
            iconBg="rgba(27,36,80,0.1)"
            iconColor="#1B2450"
            title="Fast by default"
            body="Loads quickly, even on a budget phone."
            className="col-span-1 md:col-span-2"
          />
          <Tile
            icon={<IconPackage size={18} />}
            iconBg="rgba(231,160,56,0.15)"
            iconColor="#E7A038"
            title="Real order management"
            body="Track every order and payment proof from one dashboard."
            className="col-span-1 md:col-span-2 py-2"
          />
          <Tile
            icon={<IconUsers size={18} />}
            iconBg="rgba(167,58,63,0.1)"
            iconColor="#A73A3F"
            title="Built for how you sell"
            body="Designed around Nigerian small businesses, not adapted."
            className="col-span-2 md:col-span-2 py-2"
          />
        </motion.div>
      </div>
    </section>
  );
}

function IconTile({
  children,
  bg,
  color,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <div
      className="mb-2.5 flex h-8.5 w-8.5 items-center justify-center rounded-lg"
      style={{ background: bg, color }}
    >
      {children}
    </div>
  );
}

function Tile({
  icon,
  iconBg,
  iconColor,
  title,
  body,
  className = "",
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-2xl border border-sand-300 bg-paper p-6 ${className}`}
    >
      <IconTile bg={iconBg} color={iconColor}>
        {icon}
      </IconTile>
      <h3 className="mb-1.5 text-[17px] font-semibold">{title}</h3>
      <p className="text-[13.5px] leading-relaxed text-ink-soft">{body}</p>
    </motion.div>
  );
}