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
            <li><b>Game data:</b> matches played, answers, scores and timing.</li>
            <li><b>Prize details:</b> if you win a sponsored contest, the details needed to verify you and send the prize (such as CNIC and mobile wallet).</li>
            <li><b>Technical data:</b> IP address, device and browser type, used for security and fraud prevention.</li>
            <li><b>Messages:</b> anything you send us through the contact form or email.</li>
          </ul>

          <h2>2. How we use it</h2>
          <ul>
            <li>To run your account, matches and the leaderboard.</li>
            <li>To run sponsored contests and send prizes to winners.</li>
            <li>To detect cheating, multiple accounts and fraud.</li>
            <li>To answer your questions and complaints.</li>
            <li>To meet legal obligations.</li>
          </ul>

          <h2>3. What other players see</h2>
          <p>
            Other players and website visitors can see your display name, avatar, match results and leaderboard position. Your
            mobile number is never shown publicly.
          </p>

          <h2>4. Sharing</h2>
          <p>We do not sell your data. We share it only with:</p>
          <ul>
            <li>A contest&apos;s sponsor, if you win: your display name, and what is needed to deliver the prize.</li>
            <li>Mobile wallet providers (such as Easypaisa or JazzCash) to send prizes.</li>
            <li>Service providers that host our servers and database, under confidentiality.</li>
            <li>Government or law-enforcement authorities when required by law.</li>
          </ul>

          <h2>5. Advertising and cookies</h2>
          <p>
            The Platform is free because it shows ads. Third-party vendors, including Google, use cookies to serve ads based on
            your earlier visits to this and other websites. Google&apos;s advertising cookies let it and its partners show you
            ads based on those visits. You can turn off personalised ads in{" "}
            <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">Google Ads Settings</a>, or opt out of
            some third-party vendors&apos; cookies at <a href="https://www.aboutads.info" target="_blank" rel="noreferrer">aboutads.info</a>.
          </p>

          <h2>6. Storage and security</h2>
          <p>
            Data is stored on secured servers. Access is limited to people who need it to operate the Platform. No system is
            perfectly secure, so please keep your PIN private.
          </p>

          <h2>7. Retention</h2>
          <p>We keep account records for as long as your account is active, and afterwards only as long as the law requires.</p>

          <h2>8. Your rights</h2>
          <p>
            You can ask us for a copy of your data, to correct it, or to close your account. Contact us at{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </p>

          <h2>9. Browser storage</h2>
          <p>We store a login token in your browser so you stay signed in.</p>

          <h2>10. Children</h2>
          <p>The Platform is only for people aged {SITE.minAge} and above. We close accounts belonging to minors.</p>

          <h2>11. Changes</h2>
          <p>We will post any changes to this policy on this page.</p>

          <p>
            Questions? <Link href="/contact">Contact us</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
