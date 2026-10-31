import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Dimagh Lagao ke baare mein aam sawal — account, paise, withdraw, Puzzle Challenge, fair play.",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  { q: "Dimagh Lagao kya hai?", a: "Ek 1v1 quiz game jahan do players same sawalon par muqabla karte hain. Jo zyada sahi aur zyada tez jawab de, wohi inaam jeetta hai." },
  { q: "Kya ye jua hai?", a: "Nahi. Yahan koi dice, card ya spin nahi. Nateeja sirf aap ke ilm aur raftar par hai — dono players ko bilkul same sawal milte hain." },
  { q: "Kaun khel sakta hai?", a: `Pakistan mein rehne wala koi bhi ${SITE.minAge} saal ya us se zyada umar ka shakhs. Ek insaan, ek account.` },
  { q: "Kitne ka match hota hai?", a: "Entry Rs 20, 50, 100 ya 500. Jeetne wale ko dono entries ka pot milta hai, 30% platform fee kaat kar — maslan Rs 50 entry par pot Rs 100, jeetne wale ko Rs 70." },
  { q: "Agar koi muqabil na mile to?", a: "30 second tak asli player dhoonda jata hai. Na mile to aap ko Puzzle Challenge milta hai: ek puzzle, 100 second. Waqt par hal kiya to match ka poora inaam aap ka, warna entry gayi. Paid quiz hamesha do insaanon ke beech hota hai." },
  { q: "Draw ho jaye to?", a: "Dono players ki poori entry wapas wallet mein aa jati hai." },
  { q: "Paise kaise nikalein?", a: "Wallet → Nikalwayein. Easypaisa, JazzCash ya bank account chunein. Kam az kam Rs 200. Pehli dafa CNIC verification ho sakti hai." },
  { q: "Mera inaam review mein kyun hai?", a: "Agar jeetne wale ke jawabon ka pattern ghair-mamooli ho (maslan taqreeban sab sahi magar har jawab der se, ya har match mein bilkul ek jaisi timing), to inaam foran dene ke bajaye review ke baad diya jata hai. Saaf jeet ka inaam foran wallet mein aata hai." },
  { q: "Agar beech match internet chala jaye?", a: "Aap ke paas wapas aane ke liye 10 second hain (page refresh bhi chalega). Wapas aa gaye to match wahin se chalta hai. Na aaye to aap haar jate hain aur muqabil jeet jata hai." },
  { q: "Start dabane ke baad cancel ho sakta hai?", a: "Nahi. Start dabate hi entry kat jati hai aur lobby se wapsi nahi. Lobby ya match chhora to entry wapas nahi milti aur muqabil jeet jata hai. Har match se pehle ye qawaid dikhaye jate hain aur aap \"I agree\" tick karte hain." },
  { q: "Har sawal ke liye kitna waqt?", a: "10 second. Sahi jawab 2 second tak 100 points ka, phir kam hote hote aakhri second par 10 points ka. Ghalat jawab 0. Poora match taqreeban 2 minute ka hota hai." },
  { q: "Sawal kahan se aate hain?", a: "Hamari team aur AI milkar sawal banate hain, aur har sawal ek alag fact-check se guzarta hai. Phir bhi koi ghalti nazar aaye to humein batayein — sahi sabit hone par match ka faisla dobara dekha jata hai." },
  { q: "Kya cheating ho sakti hai?", a: "Sahi jawab aur timer hamare server par rehte hain, browser mein nahi — sahi jawab aap ke jawab dene ke baad hi aata hai. Match ke dauran tab/window badalna, full screen chhorna, devtools ya extensions cheating hain: cheater foran haar jata hai aur muqabil jeet jata hai. Dono ne ki to dono haarte hain. Multiple accounts, bots ya mil kar khelna bhi mana hai." },
  { q: "Practice free hai?", a: "Haan. Computer ke saath practice match bilkul free hai, koi paisa nahi lagta aur koi inaam nahi milta." },
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
