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
        <h2 className="mb-3 font-display text-xl font-semibold">1. Who we are</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Bitvora Stores is operated by Bitvora Tech, Nigeria. We are the data controller for merchant account information. For the details customers enter when they order from a store, the merchant who runs that store decides how they are used, and we process them on the merchant&apos;s behalf.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">2. What we collect</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft mb-3">
          When you use Bitvora Stores, we collect:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14.5px] leading-relaxed text-ink-soft">
          <li>Account information: name, email, phone number, business name</li>
          <li>Identity details for merchants: your NIN (National Identification Number) and CAC registration number</li>
          <li>Plan and billing records: your plan, renewal dates, and payment status. Card details are handled by Paystack; we never see or store your card number.</li>
          <li>Store data: products, images, order history, customer details you enter</li>
          <li>Customer checkout information: name, phone, email, delivery address, order details</li>
          <li>Technical data: your IP address and basic device information, used for security</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">3. Why we use it, and our legal basis</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft mb-3">
          We use your information:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14.5px] leading-relaxed text-ink-soft">
          <li>To provide the Service you signed up for, including your store, orders, and billing (performance of our contract with you)</li>
          <li>To verify merchants before their store goes live: a one-time SMS code for your phone, and a manual review of your NIN and CAC details (our legitimate interest in keeping fraud off the platform)</li>
          <li>To send account messages, such as SMS updates on your verification (performance of our contract)</li>
          <li>To prevent abuse, for example by limiting repeated sign-up and code requests from the same IP address (legitimate interest)</li>
          <li>To keep records the law requires, such as payment records (legal obligation)</li>
        </ul>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          We do not sell your personal data or use it for advertising.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">4. Your NIN</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          We only use your NIN to confirm who is behind a store. Once we approve your details, we delete the full number and keep only its last 4 digits as a record that the check was done. Until then, it is visible only to you and to the Bitvora team members who review verifications. We never show it on your store.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">5. Customer data</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          When a customer places an order on a merchant&apos;s store, their name, phone number, delivery address, and order details are stored and shown to that merchant so they can fulfil the order. Merchants must only use this data to handle the order and their relationship with that customer.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">6. Who we share it with</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft mb-3">
          We use these service providers to run Bitvora Stores. They only get what they need to do their job:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14.5px] leading-relaxed text-ink-soft">
          <li>Supabase (database and authentication)</li>
          <li>Cloudinary (image storage)</li>
          <li>Paystack (plan payments)</li>
          <li>Termii (SMS verification codes and account messages, which receives your phone number)</li>
          <li>Upstash (rate limiting, which processes IP addresses)</li>
          <li>Vercel and Cloudflare (hosting and anonymous visit analytics)</li>
          <li>WhatsApp (order messaging, only when a customer chooses to message a merchant)</li>
        </ul>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Some of these providers store data on servers outside Nigeria. Where they do, we rely on their security commitments and contractual safeguards to protect it as Nigerian law requires. We may also disclose data when the law requires it.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">7. Cookies</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          We use cookies that are needed for the Service to work, such as keeping you logged in and remembering your dashboard layout. Our visit analytics do not use cookies to track you across sites.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">8. Data storage and security</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          We protect your data with access controls on our database, encrypted connections, and by limiting which team members can see identity details. No system is completely secure. If a breach puts your rights at risk, we will notify the Nigeria Data Protection Commission within 72 hours and tell you without undue delay.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">9. How long we keep it</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          We keep your account and store data while your account is open. When you ask us to delete your account, we delete your store data and identity details within 30 days, except records that Nigerian law requires us to keep for longer, such as payment records.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">10. Your rights</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft mb-3">
          Under the Nigeria Data Protection Act 2023, you can ask us to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14.5px] leading-relaxed text-ink-soft">
          <li>Give you a copy of the personal data we hold about you</li>
          <li>Correct data that is wrong</li>
          <li>Delete your data</li>
          <li>Stop or limit how we use it, or object to a use</li>
          <li>Send your data to you or another service in a usable format</li>
          <li>Withdraw consent you have given, at any time</li>
        </ul>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Email help@bitvoratech.com and we will respond within 30 days. If you are not happy with our answer, you can complain to the Nigeria Data Protection Commission (ndpc.gov.ng).
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">11. Children</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Bitvora Stores is not meant for anyone under 18, and we do not knowingly collect data from children.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">12. Changes to this policy</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          We may update this policy from time to time. We&apos;ll note the &quot;last updated&quot; date above when we do, and tell merchants by email about significant changes.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">13. Contact</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Questions about your data? Reach us at help@bitvoratech.com.
        </p>
      </section>
    </LegalLayout>
  )
}
