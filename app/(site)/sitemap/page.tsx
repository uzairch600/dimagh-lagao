import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import { FOOTER } from "@/lib/site";

export const metadata: Metadata = { title: "Sitemap", description: "Dimagh Lagao website ke saare pages." };

export default function SitemapPage() {
  return (
    <>
      <PageHero eyebrow="Sitemap" title="Saare pages" />
      <section className="site-section">
        <div className="site-container narrow sitemap-grid">
          <div>
            <h3>Main</h3>
            <Link href="/"><ChevronRight size={16} /> Home</Link>
          </div>
          {FOOTER.map((g) => (
            <div key={g.title}>
              <h3>{g.title}</h3>
              {g.links.map((l) => (
                <Link key={l.href} href={l.href}>
                  <ChevronRight size={16} /> {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
