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
            <li>We may ask for identity verification (such as CNIC) before awarding a prize.</li>
          </ul>

          <h2>2. A free game of skill</h2>
          <p>
            Playing on {SITE.name} is free. There are no entry fees, no wallet and no stakes: you never pay to play a match and
            you never risk money. In each quiz match both players receive the same questions in the same order and the same
            time limit; the result depends only on correct answers and speed, as described on the{" "}
            <Link href="/how-to-play">How to play</Link> page. There is no element of chance such as dice, cards or spins.
          </p>

          <h2>3. Sponsored contests</h2>
          <ul>
            <li>
              From time to time, sponsors (brands, companies or individuals) may run contests on the Platform and provide prizes.
              Entry to a sponsored contest is always free; no purchase or payment is needed to take part or to win.
            </li>
            <li>Each contest shows its own rules, dates, eligibility and prizes before it starts. Those rules apply alongside these Terms.</li>
            <li>
              Prizes are provided by the sponsor and sent to the mobile wallet (such as Easypaisa or JazzCash) registered to the
              winner&apos;s own mobile number, after verification. A prize may be withheld if a winner breaches these Terms or the
              contest rules.
            </li>
            <li>You are responsible for any taxes that apply to a prize under Pakistani law.</li>
          </ul>

          <h2>4. Advertising</h2>
          <p>
            The Platform is free because it shows advertisements, and some contests carry a sponsor&apos;s branding. Ads are
            provided by third parties (such as Google). See the <Link href="/privacy">Privacy Policy</Link> for how ads use
            cookies.
          </p>

          <h2>5. Fair play</h2>
          <p>The following are not allowed and may lead to cancelled results, removal from the leaderboard or contests, and account closure:</p>
          <ul>
            <li>Creating or using more than one account, or using someone else&apos;s account.</li>
            <li>Colluding with another player, including deliberately losing.</li>
            <li>Using bots, scripts, automation or any tool that answers for you.</li>
            <li>
              During a match: switching tab or window, leaving full screen, opening developer tools, or running browser
              extensions. A player caught doing this loses the match at once and the opponent wins. If both players are caught,
              both lose.
            </li>
            <li>Exploiting bugs or interfering with the Platform.</li>
          </ul>

          <h2>6. Question errors and disputes</h2>
          <p>
            Questions are checked before use, but mistakes can happen. If you believe a question or answer was wrong, contact
            us within 7 days of the match. If we confirm the error, we may adjust or void the result of the affected match.
            Our decision after review is final.
          </p>

          <h2>7. Technical problems</h2>
          <p>
            If a match cannot be completed because of a fault on our side, it is cancelled without a result. If you leave a 1v1
            match, or disconnect and do not return within 10 seconds, you lose that match.
          </p>

          <h2>8. Suspension and closure</h2>
          <p>We may suspend or close accounts that breach these Terms. You may close your account at any time by contacting us.</p>

          <h2>9. Liability</h2>
          <p>The Platform is provided &quot;as is&quot;, free of charge. To the extent permitted by law, we are not liable for any indirect loss.</p>

          <h2>10. Changes</h2>
          <p>We may update these Terms. Material changes will be announced on the Platform before they take effect.</p>

          <h2>11. Governing law</h2>
          <p>These Terms are governed by the laws of Pakistan.</p>

          <h2>12. Contact</h2>
          <p>
            Questions about these Terms, or interested in sponsoring a contest: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>{" "}
            or the <Link href="/contact">contact page</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
