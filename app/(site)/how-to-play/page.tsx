import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, Clock, Target, Timer, Trophy, Wallet } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kaise khelein",
  description: "Dimagh Lagao kaise khelein — account, entry, 1v1 match, scoring aur inaam ki poori tafseel.",
};

const fee = SITE.platformFeePercent;
const prize = (e: number) => Math.round(e * 2 * (1 - fee / 100));

export default function HowToPlay() {
  return (
    <>
      <PageHero eyebrow="Guide" title="Kaise khelein?" sub="Do minute ka match, das sawal, ek winner. Yahan sab kuch tafseel se." />
      <section className="site-section">
        <div className="site-container prose-grid">
          <article className="prose">
            <h2>1. Account banayein</h2>
            <p>
              <Link href="/play">Play</Link> page par apna mobile number likhein, naam aur 4-digit PIN banayein. Bas. Agli baar
              isi number aur PIN se login karein. Ek insaan sirf ek account bana sakta hai.
            </p>

            <h2>2. Wallet mein paise daalein</h2>
            <p>
              Wallet mein jaa kar &quot;Paise daalein&quot; dabayein. Paise sirf aap ke wallet mein jate hain aur har entry, inaam
              aur withdraw ki history wahan dikhti hai.
            </p>

            <h2>3. Category aur entry chunein</h2>
            <p>Har category ke liye 4 entry levels hain:</p>
            <table className="site-table">
              <thead>
                <tr><th>Entry</th><th>Kul pot</th><th>Jeetne wale ko</th></tr>
              </thead>
              <tbody>
                {[20, 50, 100, 500].map((e) => (
                  <tr key={e}>
                    <td>Rs {e}</td>
                    <td>Rs {e * 2}</td>
                    <td className="gold"><b>Rs {prize(e)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted">Platform fee {fee}% hai — yahi hamari kamai hai.</p>

            <h2>4. Muqabil se match</h2>
            <p>
              App aap ko usi category aur usi entry wale kisi asli player se milaati hai. Start dabate hi entry fee kat jati hai aur
              lobby se wapsi nahi hoti. Agar <b>30 second</b> mein koi player na mile, to app khud <b>&quot;Computer&quot;</b> ban kar aap ke saath
              khelti hai aur aap ke muqable mein utni hi raqam lagati hai (har entry par). Computer hamesha
              &quot;Computer&quot; naam aur robot icon ke saath dikhta hai.
            </p>

            <h2>5. Scoring</h2>
            <p>Dono players ko bilkul same 10 sawal, same order mein milte hain. Har sawal ke liye 10 second.</p>
            <ul>
              <li><b>Sahi jawab 2 second ke andar:</b> 100 points</li>
              <li><b>Us ke baad:</b> har second ke saath kam, aakhri second par 10 points</li>
              <li><b>Ghalat ya time khatam:</b> 0 points</li>
            </ul>
            <p>10 sawal ke baad jiske points zyada, wohi jeeta. Barabar points par dono ki entry wapas.</p>

            <h2>Puzzles</h2>
            <p>
              Khelein mein Quiz ke saath Puzzles ka hissa bhi hai: <b>Taaj</b>, <b>Suraj Chaand</b>, <b>Number Raasta</b> aur{" "}
              <b>Bhool Bhulaiyan</b>. Dono players ko bilkul same 3 puzzles milte hain, chhote se bade. Board poora sahi hote hi
              server check karta hai — jo jaldi hal kare us ke zyada points. Har puzzle ka waqt us ke size ke hisaab se 45 se 150
              second hota hai. Match se pehle har puzzle ke qawaid aur ek hal kiya hua misaal dikhaya jata hai.
            </p>

            <h2>6. Inaam aur withdraw</h2>
            <p>
              Jeetne par inaam foran wallet mein aa jata hai. Wallet se Easypaisa, JazzCash ya bank account mein withdraw request
              bhej sakte hain. Tafseel ke liye <Link href="/refund-policy">Refund Policy</Link> dekhein.
            </p>
          </article>

          <aside className="side-cards">
            <div className="side-card"><Timer size={22} /><b>10 sawal × 10 second</b><p>Poora match taqreeban 2 minute.</p></div>
            <div className="side-card"><Target size={22} /><b>Sahi + tez = jeet</b><p>Jitna tez sahi jawab, utne zyada points.</p></div>
            <div className="side-card"><Bot size={22} /><b>30 second rule</b><p>Player na mile to app khud khelti hai.</p></div>
            <div className="side-card"><Wallet size={22} /><b>Draw par refund</b><p>Barabar points par entry wapas.</p></div>
            <div className="side-card"><Clock size={22} /><b>Practice free</b><p>Computer ke saath free practice, koi paisa nahi.</p></div>
            <Link href="/play" className="btn btn-gold btn-block">
              <Trophy size={18} /> Abhi khelein <ArrowRight size={18} />
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
