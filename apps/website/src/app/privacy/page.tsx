import type { Metadata } from 'next'
import { LegalLayout } from '@/components/LegalLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy — Bitvora Stores',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updatedDate="October 2026">
      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">1. What we collect</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft mb-3">
          When you use Bitvora Stores, we collect:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14.5px] leading-relaxed text-ink-soft">
          <li>Account information: name, email, phone number, business name</li>
          <li>Identity details for merchants: your NIN (National Identification Number) and CAC registration number</li>
          <li>Store data: products, images, order history, customer details you enter</li>
          <li>Customer checkout information: name, phone, delivery address, order details</li>
          <li>Usage data: how you interact with the dashboard and storefront, and your IP address</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">2. How we use it</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft mb-3">We use this information to:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14.5px] leading-relaxed text-ink-soft">
          <li>Provide and operate the Service</li>
          <li>Process and display orders</li>
          <li>Verify merchants before their store can go live: we check your phone number with a one-time SMS code, and our team reviews your NIN and CAC details by hand</li>
          <li>Communicate with you about your account, including SMS updates on your verification</li>
          <li>Prevent abuse, for example by limiting repeated sign-up and code requests from the same IP address</li>
          <li>Improve the platform based on how it&apos;s used</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">3. Customer data</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          When a customer places an order on a merchant&apos;s store, the customer&apos;s name, phone number, delivery address, and order details are stored and made visible to that merchant so they can fulfil the order. Merchants are responsible for handling this data appropriately.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">4. Third-party services</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft mb-3">
          We use third-party services to operate Bitvora Stores, including:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14.5px] leading-relaxed text-ink-soft">
          <li>Supabase (database and authentication)</li>
          <li>Cloudinary (image storage)</li>
          <li>Termii (SMS verification codes and account messages, which receives your phone number)</li>
          <li>Upstash (rate limiting, which processes IP addresses)</li>
          <li>Vercel and Cloudflare (hosting and anonymous visit analytics)</li>
          <li>WhatsApp (order messaging, initiated by the customer)</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">5. Data storage and security</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          We take reasonable measures to protect your data, including access controls on our database. NIN and CAC details are only visible to you and to the Bitvora team members who review verifications. We never show them on your store. No system is completely secure, and we cannot guarantee absolute security of your information.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">6. How long we keep it</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          We keep your account and store data while your account is open. When you ask us to delete your account, we delete your store data and identity details, except where Nigerian law requires us to keep records for longer.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">7. Your rights</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          You can access, update, or request deletion of your account information at any time by contacting us or through your account settings.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">8. Changes to this policy</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          We may update this policy from time to time. We&apos;ll note the &quot;last updated&quot; date above when we do.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">9. Contact</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Questions about your data? Reach us at help@bitvoratech.com.
        </p>
      </section>

      <div className="rounded-xl border border-marigold-500/40 bg-marigold-50 p-4 mt-10">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          <strong>Draft notice:</strong> This document is a starting template and has not been reviewed by a lawyer or checked against Nigeria&apos;s NDPA (Nigeria Data Protection Act) requirements in detail. Have this reviewed by qualified legal counsel before relying on it for a live commerce platform handling customer data.
        </p>
      </div>
    </LegalLayout>
  )
}