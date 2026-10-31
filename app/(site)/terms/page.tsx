import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `${SITE.name} istemal karne ki sharait.`,
};

export default function Terms() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms & Conditions" sub={`Last updated: ${SITE.updated}`} />
      <section className="site-section">
        <div className="site-container narrow prose">
          <p>
            These Terms govern your use of {SITE.name} (the &quot;Platform&quot;), including the website at {SITE.domain} and
            the game. By creating an account or playing, you agree to these Terms. If you do not agree, please do not use the
            Platform.
          </p>

          <h2>1. Eligibility</h2>
          <ul>
            <li>You must be at least {SITE.minAge} years old and a resident of Pakistan.</li>
            <li>You may hold only one account. The mobile number on the account must be registered in your own name.</li>
            <li>We may ask for identity verification (such as CNIC) at any time, and before any withdrawal.</li>
          </ul>

          <h2>2. Nature of the game</h2>
          <p>
            {SITE.name} is a game of skill. In each match both players receive the same questions in the same order and the
            same time limit. The result depends only on the number of correct answers and the speed of answering, as described
            on the <Link href="/how-to-play">How to play</Link> page. There is no element of chance such as dice, cards or
            spins.
          </p>

          <h2>3. Wallet, entry fees and prizes</h2>
          <ul>
            <li>Paid matches require an entry fee, which is deducted from your wallet when the match starts.</li>
            <li>
              The prize equals both entry fees minus a platform fee of {SITE.platformFeePercent}%. The prize for each entry
              level is shown before you join.
            </li>
            <li>If both players finish with equal points, both entry fees are returned in full.</li>
            <li>Wallet balance is not a bank deposit and earns no interest.</li>
          </ul>

          <h2>4. Matches against the computer</h2>
          <p>
            If no other player is found within 30 seconds, the Platform may offer or start a match against a computer opponent
            for entries up to a published limit. In such matches the Platform itself pays the entry on the opposing side and
            pays the prize if you win. The computer opponent is always clearly labelled &quot;Computer&quot; and plays at a fixed
            strength that is the same for every player, as described on the <Link href="/fair-play">Fair Play</Link> page.
            Practice matches against the computer are free and carry no prize.
          </p>

          <h2>5. Withdrawals</h2>
          <ul>
            <li>You can request a withdrawal of your available balance (minimum Rs 200) to an account in your own name.</li>
            <li>Withdrawals are reviewed before payment and are usually processed within a few working days.</li>
            <li>We may hold a withdrawal while we investigate suspected fraud or a breach of these Terms.</li>
          </ul>

          <h2>6. Fair play</h2>
          <p>The following are not allowed and may lead to cancelled results, forfeited balances and account closure:</p>
          <ul>
            <li>Creating or using more than one account, or using someone else&apos;s account.</li>
            <li>Colluding with another player, including deliberately losing.</li>
            <li>Using bots, scripts, automation or any tool that answers for you.</li>
            <li>Exploiting bugs or interfering with the Platform.</li>
            <li>Depositing funds that are not yours or that come from illegal activity.</li>
          </ul>

          <h2>7. Question errors and disputes</h2>
          <p>
            Questions are checked before use, but mistakes can happen. If you believe a question or answer was wrong, contact
            us within 7 days of the match. If we confirm the error, we may adjust or void the result of the affected match.
            Our decision after review is final.
          </p>

          <h2>8. Technical problems</h2>
          <p>
            If a match cannot be completed because of a fault on our side, the entry fees for that match are refunded. Problems
            with your own device or internet connection do not stop a match; unanswered questions score zero.
          </p>

          <h2>9. Taxes</h2>
          <p>You are responsible for any taxes that apply to your winnings under Pakistani law.</p>

          <h2>10. Suspension and closure</h2>
          <p>
            We may suspend or close accounts that breach these Terms. You may close your account at any time by contacting us;
            any available balance will be paid out after verification, subject to Section 6.
          </p>

          <h2>11. Liability</h2>
          <p>
            The Platform is provided &quot;as is&quot;. To the extent permitted by law, our total liability to you is limited to
            the balance in your wallet.
          </p>

          <h2>12. Changes</h2>
          <p>We may update these Terms. Material changes will be announced on the Platform before they take effect.</p>

          <h2>13. Governing law</h2>
          <p>These Terms are governed by the laws of Pakistan.</p>

          <h2>14. Contact</h2>
          <p>
            Questions about these Terms: <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or the{" "}
            <Link href="/contact">contact page</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
