import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `${SITE.name} par deposit, refund aur withdraw ke qawaid.`,
};

export default function Refund() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Refund & Withdrawal Policy" sub={`Last updated: ${SITE.updated}`} />
      <section className="site-section">
        <div className="site-container narrow prose">
          <h2>1. Deposits</h2>
          <ul>
            <li>Deposits are added to your wallet after the payment provider confirms them.</li>
            <li>
              If money leaves your account but does not reach your wallet, contact us with the transaction ID. After
              confirmation, we will either credit your wallet or reverse the payment.
            </li>
            <li>Unused deposits can be withdrawn under Section 4 (identity verification may apply).</li>
          </ul>

          <h2>2. Match refunds</h2>
          <ul>
            <li><b>Draw:</b> both players get their full entry fee back automatically.</li>
            <li><b>Fault on our side:</b> if a match cannot be completed because of our server error, entry fees are refunded.</li>
            <li><b>Confirmed question error:</b> the affected match may be voided and entries refunded (see Terms, Section 7).</li>
            <li>
              <b>Your own connection or device:</b> not a reason for refund — the match continues and unanswered questions score
              zero.
            </li>
            <li>Entry fees for completed matches are not refundable.</li>
          </ul>

          <h2>3. Searching for an opponent</h2>
          <p>Your entry fee is only deducted when a match starts. Cancelling a search costs nothing.</p>

          <h2>4. Withdrawals</h2>
          <ul>
            <li>Minimum withdrawal: Rs 200.</li>
            <li>Payouts go only to an Easypaisa, JazzCash or bank account in your own name.</li>
            <li>Your first withdrawal may require CNIC verification.</li>
            <li>Requests are reviewed and usually paid within a few working days.</li>
            <li>The amount is held from your balance while the request is pending, and returned to your wallet if it is rejected.</li>
          </ul>

          <h2>5. How to ask for help</h2>
          <p>
            Use the <Link href="/contact">contact page</Link> or email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> with your
            registered mobile number and transaction details.
          </p>
        </div>
      </section>
    </>
  );
}
