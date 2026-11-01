import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import { LeaderboardTable } from "@/components/site/Live";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Dimagh Lagao ke top players — sab se zyada jeet aur hal kiye puzzles wale.",
};

export default function LeaderboardPage() {
  return (
    <>
      <PageHero eyebrow="Top players" title="Leaderboard" sub="Sab se zyada kamane wale players. Har match ke baad update hota hai." />
      <section className="site-section">
        <div className="site-container narrow">
          <LeaderboardTable />
        </div>
      </section>
    </>
  );
}
