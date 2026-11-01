import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Dimagh Lagao ke baare mein aam sawal — account, free matches, puzzles, leaderboard, sponsor muqable, fair play.",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  { q: "Dimagh Lagao kya hai?", a: "Ek free 1v1 quiz aur puzzle game jahan players same sawalon par muqabla karte hain. Jo zyada sahi aur zyada tez jawab de, wohi jeetta hai aur leaderboard par upar jata hai." },
  { q: "Kya is mein paise lagte hain?", a: "Nahi. Har match bilkul free hai — koi entry fee nahi, koi wallet nahi. Aap ka ek paisa bhi daao par nahi lagta, is liye ye jua nahi." },
  { q: "Kaun khel sakta hai?", a: `Pakistan mein rehne wala koi bhi ${SITE.minAge} saal ya us se zyada umar ka shakhs. Ek insaan, ek account.` },
  { q: "Agar koi muqabil na mile to?", a: "30 second tak asli player dhoonda jata hai. Na mile to computer aap ke saath khelta hai. Lobby mein \"Wapas\" daba kar kabhi bhi nikal sakte hain." },
  { q: "Leaderboard par kya ginta hai?", a: "Asli players ke khilaaf jeet, aur waqt par hal kiye puzzles. Computer ke khilaaf jeet nahi ginti." },
  { q: "Sponsor muqable kya hain?", a: "Jald hi brands aur sponsors apne muqable karwayenge aur inaam khud denge. Aap free khelenge — sab se behtar khelne wala inaam ka haqdar hoga. Inaam aap ke registered number ke Easypaisa/JazzCash par bheja jayega." },
  { q: "Agar beech match internet chala jaye?", a: "Aap ke paas wapas aane ke liye 10 second hain (page refresh bhi chalega). Wapas aa gaye to match wahin se chalta hai. Na aaye to aap haar jate hain aur muqabil jeet jata hai." },
  { q: "Match beech mein chhor sakte hain?", a: "Haan, \"Chhor dein\" dabayein. Lekin 1v1 mein match chhorna haar ginta hai aur muqabil jeet jata hai. Har match se pehle qawaid dikhaye jate hain aur aap \"I agree\" tick karte hain." },
  { q: "Har sawal ke liye kitna waqt?", a: "10 second. Sahi jawab 2 second tak 100 points ka, phir kam hote hote aakhri second par 10 points ka. Ghalat jawab 0. Poora match taqreeban 2 minute ka hota hai." },
  { q: "Sawal kahan se aate hain?", a: "Hamari team aur AI milkar sawal banate hain, aur har sawal ek alag fact-check se guzarta hai. Phir bhi koi ghalti nazar aaye to humein batayein — sahi sabit hone par match ka faisla dobara dekha jata hai." },
  { q: "Kya cheating ho sakti hai?", a: "Sahi jawab aur timer hamare server par rehte hain, browser mein nahi — sahi jawab aap ke jawab dene ke baad hi aata hai. Match ke dauran tab/window badalna, full screen chhorna, devtools ya extensions cheating hain: cheater foran haar jata hai aur muqabil jeet jata hai. Dono ne ki to dono haarte hain. Multiple accounts, bots ya mil kar khelna bhi mana hai." },
  { q: "Sponsor kaise banein?", a: "Brand ya company apna muqabla karwana chahti hai to Rabta page se humein message karein — topic mein \"Sponsor banna hai\" chunein." },
];

export default function FAQ() {
  return (
    <>
      <PageHero eyebrow="Madad" title="Aam sawal (FAQ)" sub="Jawab nahi mila? Rabta page se humein message karein." />
      <section className="site-section">
        <div className="site-container narrow faq-list">
          {FAQS.map((f) => (
            <details key={f.q} className="faq">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
          <p className="muted center">
            Aur sawal? <Link href="/contact">Humein message karein</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
