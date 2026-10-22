import type { Metadata } from 'next'
import { LegalLayout } from '@/components/LegalLayout'

export const metadata: Metadata = {
  title: 'Terms of Service — Bitvora Stores',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updatedDate="October 2026">
      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">1. Agreement to terms</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          By creating an account or using Bitvora Stores (&quot;the Service&quot;), operated by Bitvora Tech (&quot;we&quot;, &quot;us&quot;), you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the Service.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">2. What Bitvora Stores is</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Bitvora Stores lets merchants create and manage an online store, list products, and receive orders from customers. We provide the platform and tools; we are not a party to transactions between merchants and their customers.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">3. Who can sign up</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          To open a merchant account you must be at least 18 years old and run a business registered with the Corporate Affairs Commission (CAC). Before your store can go live, we verify your phone number and review the NIN and CAC details you give us. We may decline or reverse a verification if the details are wrong or cannot be confirmed.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">4. Merchant responsibilities</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft mb-3">
          As a merchant using the Service, you are responsible for:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14.5px] leading-relaxed text-ink-soft">
          <li>The accuracy of your product listings, prices, and descriptions</li>
          <li>Fulfilling orders placed through your store</li>
          <li>Complying with applicable Nigerian consumer protection and tax laws</li>
          <li>The content, images, and information you upload to your store</li>
          <li>Handling your customers&apos; personal data lawfully and only to fulfil their orders</li>
          <li>Any communication with your customers, including via WhatsApp</li>
          <li>Keeping your login details secure</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">5. Plans and billing</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Merchant plans are paid in advance, monthly or annually, by debit card through Paystack. Your plan renews automatically at the end of each period until you cancel. You can cancel from the Plan & billing page at any time; your plan stays active until the end of the period you have paid for. Fees already paid are not refunded, except where the law requires it. If a renewal payment fails, we may pause your stores until the plan is paid. We will tell you before we change plan prices.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">6. Orders between merchants and customers</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Customers pay merchants directly, by bank transfer or on delivery. Bitvora Stores does not hold or process these payments and is not responsible for payment, delivery, refund, or quality disputes between merchants and their customers.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">7. Your content</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          You keep ownership of the content you upload, such as product photos and descriptions. You give us permission to store, display, and resize it as needed to run your store and the Service. You confirm you have the right to use everything you upload.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">8. Acceptable use</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft mb-3">
          You may not use the Service to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[14.5px] leading-relaxed text-ink-soft">
          <li>Sell counterfeit, stolen, or illegal goods</li>
          <li>Misrepresent your business or products</li>
          <li>Attempt to disrupt, hack, or reverse-engineer the platform</li>
          <li>Use the Service for fraudulent activity</li>
          <li>Collect or misuse other people&apos;s personal data</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">9. Suspension and termination</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          We may suspend or close your account if you break these terms, give false verification details, or use the Service in a way that could harm customers or the platform. Where we can, we will tell you why first. You may stop using the Service and ask us to delete your account at any time.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">10. Limitation of liability</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          The Service is provided &quot;as is&quot;. To the extent the law allows, Bitvora Tech is not liable for indirect losses arising from your use of the Service, including lost sales, disputes with customers, or platform downtime, and our total liability to you is limited to the plan fees you paid us in the three months before the claim.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">11. Governing law</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          These terms are governed by the laws of the Federal Republic of Nigeria. We will try to settle any dispute with you informally first.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">12. Changes to these terms</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          We may update these terms from time to time. We will note the date above and, for significant changes, tell merchants by email. Continued use of the Service after changes means you accept the updated terms.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">13. Contact</h2>
        <p className="text-[14.5px] leading-relaxed text-ink-soft">
          Questions about these terms? Reach us at help@bitvoratech.com.
        </p>
      </section>
    </LegalLayout>
  )
}
