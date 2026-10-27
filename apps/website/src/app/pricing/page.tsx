import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { FAQ, type FaqItem } from "@/components/FAQ";
import { PremiumFooter } from "@/components/PremiumFooter";
import { Pricing } from "@/components/Pricing";

export const metadata: Metadata = {
  title: "Pricing — Bitvora Stores",
  description: "Simple Naira pricing for Bitvora Stores. Compare plans, store and product limits, and customization features.",
  alternates: { canonical: "/pricing" },
};

const PRICING_FAQS: FaqItem[] = [
  {
    q: "Is there a free plan?",
    a: "No. Every plan is paid, so there's no free tier to outgrow. The limits of each plan are listed above.",
  },
  {
    q: "What happens when I reach a limit?",
    a: "You'll be asked to upgrade before you can add more stores or products. Everything you've already published stays live.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes, you can upgrade at any time. To move to a smaller plan, your stores and products need to fit within that plan's limits.",
  },
  {
    q: "How does annual billing work?",
    a: "Annual billing charges you once for 10 months and covers 12 — that's two months free compared with paying monthly.",
  },
  {
    q: "How do I pay for my plan?",
    a: "By debit card through Paystack, right after you sign up and verify your phone number. Your plan renews automatically and you can cancel from your dashboard.",
  },
  {
    q: "What payment methods can my customers use?",
    a: "Customers pay by bank transfer or pay-on-delivery, straight to the merchant.",
  },
];

export default function PricingPage() {
  return (
    <main className="overflow-x-hidden bg-paper text-ink">
      <Nav />
      <Pricing />
      <FAQ items={PRICING_FAQS} />
      <PremiumFooter />
    </main>
  );
}