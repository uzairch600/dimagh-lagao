import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import { LiveStrip, WinnersList } from "@/components/site/Live";

export const metadata: Metadata = {
  title: "Winners",
  description: "Dimagh Lagao ke taaza nateeje — kisne kis ko haraya aur kisne kaunsa puzzle hal kiya, live.",
};

export default function Winners() {
  return (
    <>
      <PageHero eyebrow="Live" title="Taaza winners" sub="Har 1v1 jeet aur hal kiya puzzle yahan live aata hai. Agla naam aap ka ho sakta hai." />
      <section className="site-section">
        <div className="site-container">
          <LiveStrip />
          <div style={{ height: 28 }} />
          <WinnersList limit={12} />
          <div className="center-cta">
            <Link href="/play" className="btn btn-gold btn-lg">
              Muqabla shuru karein <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
