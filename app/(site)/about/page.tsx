import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, Scale, Sparkles } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Hamare baare mein",
  description: "Dimagh Lagao kya hai, kis ne banaya aur kyun.",
};

export default function About() {
  return (
    <>
      <PageHero eyebrow="About" title="Hamare baare mein" sub="Quiz ka shauq, muqable ka maza, aur imaandar hisaab." />
      <section className="site-section">
        <div className="site-container prose-grid">
          <article className="prose">
            <h2>Hum kaun hain</h2>
            <p>
              {SITE.name} ek Pakistani skill gaming platform hai. Hamara maqsad simple hai: Pakistan mein quiz ka jo shauq hai —
              TV quiz shows se le kar dosto ke beech &quot;bata kaun jaanta hai&quot; tak — usay ek tez, saaf aur mazedaar 1v1
              muqable mein badalna.
            </p>
            <h2>Kyun banaya</h2>
            <p>
              Zyada tar &quot;earning&quot; apps qismat par chalti hain. Hum chahte the ke jeet sirf us ki ho jo zyada jaanta hai
              aur tez sochta hai. Is liye har match mein dono players ko same sawal, same waqt milta hai, aur faisla server
              karta hai.
            </p>
            <h2>Hamare usool</h2>
            <ul>
              <li><b>Skill, qismat nahi</b> — koi spin, dice ya card nahi.</li>
              <li><b>Saaf hisaab</b> — platform fee {SITE.platformFeePercent}%, har rupaye ki history wallet mein.</li>
              <li><b>Koi dhoka nahi</b> — computer opponent hamesha &quot;Computer&quot; likha hota hai.</li>
              <li><b>Zimmedari</b> — sirf {SITE.minAge}+ players, aur apni had mein khelne ki targhib.</li>
            </ul>
          </article>
          <aside className="side-cards">
            <div className="side-card"><Sparkles size={22} /><b>Pakistani content</b><p>Pakistan GK, cricket aur apni zubaan.</p></div>
            <div className="side-card"><Scale size={22} /><b>Fair play</b><p>Server-side timer aur fact-checked sawal.</p></div>
            <div className="side-card"><Heart size={22} /><b>Players pehle</b><p>Shikayat? Hum sunte hain — rabta karein.</p></div>
            <Link href="/play" className="btn btn-gold btn-block">
              Abhi khelein <ArrowRight size={18} />
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
