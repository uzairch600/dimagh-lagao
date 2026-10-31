import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `${SITE.name} aap ka data kaise collect aur istemal karta hai.`,
};

export default function Privacy() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" sub={`Last updated: ${SITE.updated}`} />
      <section className="site-section">
        <div className="site-container narrow prose">
          <p>
            This policy explains what information {SITE.name} collects, why we collect it and how we protect it.
          </p>

          <h2>1. Information we collect</h2>
          <ul>
            <li><b>Account details:</b> your name, mobile number and PIN. The PIN is stored only in encrypted (hashed) form — we cannot see it.</li>
            <li><b>Verification details:</b> CNIC and payout account details, when you request a withdrawal.</li>
            <li><b>Game data:</b> matches played, answers, scores and timing.</li>
            <li><b>Wallet data:</b> deposits, entry fees, prizes, refunds and withdrawals.</li>
            <li><b>Technical data:</b> IP address, device and browser type, used for security and fraud prevention.</li>
            <li><b>Messages:</b> anything you send us through the contact form or email.</li>
          </ul>

          <h2>2. How we use it</h2>
          <ul>
            <li>To run your account, matches and wallet.</li>
            <li>To process payments and withdrawals.</li>
            <li>To detect cheating, multiple accounts and fraud.</li>
            <li>To answer your questions and complaints.</li>
            <li>To meet legal and tax obligations.</li>
          </ul>

          <h2>3. What other players see</h2>
          <p>
            Other players and website visitors can see your display name, avatar, match results and leaderboard position. Your
            mobile number is never shown publicly.
          </p>

          <h2>4. Sharing</h2>
          <p>We do not sell your data. We share it only with:</p>
          <ul>
            <li>Payment providers (such as Easypaisa, JazzCash or banks) to process your transactions.</li>
            <li>Service providers that host our servers and database, under confidentiality.</li>
            <li>Government or law-enforcement authorities when required by law.</li>
          </ul>

          <h2>5. Storage and security</h2>
          <p>
            Data is stored on secured servers. Access is limited to people who need it to operate the Platform. No system is
            perfectly secure, so please keep your PIN private.
          </p>

          <h2>6. Retention</h2>
          <p>
            We keep account and transaction records for as long as your account is active and afterwards for as long as the law
            requires for financial records.
          </p>

          <h2>7. Your rights</h2>
          <p>
            You can ask us for a copy of your data, to correct it, or to close your account. Contact us at{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </p>

          <h2>8. Browser storage</h2>
          <p>
            We store a login token in your browser so you stay signed in. We do not use advertising trackers.
          </p>

          <h2>9. Children</h2>
          <p>The Platform is only for people aged {SITE.minAge} and above. We close accounts belonging to minors.</p>

          <h2>10. Changes</h2>
          <p>We will post any changes to this policy on this page.</p>

          <p>
            Questions? <Link href="/contact">Contact us</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
