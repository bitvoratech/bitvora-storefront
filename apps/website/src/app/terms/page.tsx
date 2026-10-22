import type { Metadata } from 'next'
import { LegalLayout } from '@/components/LegalLayout'

export const metadata: Metadata = {
  title: 'Terms of Service — Bitvora Stores',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updatedDate="September 2026">
      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">1. Agreement to terms</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          By creating an account or using Bitvora Stores (&quot;the Service&quot;), operated by Bitvoratech (&quot;we&quot;, &quot;us&quot;), you agree to these Terms of Service. If you do not agree, please do not use the Service.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">2. What Bitvora Stores is</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Bitvora Stores lets merchants create and manage an online store, list products, and receive orders from customers. We provide the platform and tools; we are not a party to transactions between merchants and their customers.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">3. Merchant responsibilities</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft mb-3">
          As a merchant using the Service, you are responsible for:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14.5px] leading-relaxed text-ink-soft">
          <li>The accuracy of your product listings, prices, and descriptions</li>
          <li>Fulfilling orders placed through your store</li>
          <li>Complying with applicable Nigerian consumer protection and tax laws</li>
          <li>The content, images, and information you upload to your store</li>
          <li>Any communication with your customers, including via WhatsApp</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">4. Payments and orders</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Bitvora Stores does not currently process card payments directly. Orders placed with bank transfer or pay-on-delivery are settled directly between the merchant and their customer. We are not responsible for payment disputes between merchants and customers.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">5. Acceptable use</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft mb-3">You may not use the Service to:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14.5px] leading-relaxed text-ink-soft">
          <li>Sell counterfeit, stolen, or illegal goods</li>
          <li>Misrepresent your business or products</li>
          <li>Attempt to disrupt, hack, or reverse-engineer the platform</li>
          <li>Use the Service for fraudulent activity</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">6. Termination</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          We may suspend or terminate your access to the Service if you violate these terms. You may stop using the Service at any time.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">7. Limitation of liability</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          The Service is provided &quot;as is&quot; without warranties of any kind. Bitvoratech is not liable for losses arising from your use of the Service, including lost sales, disputes with customers, or platform downtime.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">8. Changes to these terms</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          We may update these terms from time to time. Continued use of the Service after changes means you accept the updated terms.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">9. Contact</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Questions about these terms? Reach us at help@bitvorastorefront.com.
        </p>
      </section>

      <div className="rounded-xl border border-marigold-500/40 bg-marigold-50 p-4 mt-10">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          <strong>Draft notice:</strong> This document is a starting template and has not been reviewed by a lawyer. Have this reviewed by qualified legal counsel before relying on it for a live commerce platform.
        </p>
      </div>
    </LegalLayout>
  )
}