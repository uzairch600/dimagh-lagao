import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Dimagh Lagao ke baare mein aam sawal — account, paise, withdraw, computer opponent, fair play.",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  { q: "Dimagh Lagao kya hai?", a: "Ek 1v1 quiz game jahan do players same sawalon par muqabla karte hain. Jo zyada sahi aur zyada tez jawab de, wohi inaam jeetta hai." },
  { q: "Kya ye jua hai?", a: "Nahi. Yahan koi dice, card ya spin nahi. Nateeja sirf aap ke ilm aur raftar par hai — dono players ko bilkul same sawal milte hain." },
  { q: "Kaun khel sakta hai?", a: `Pakistan mein rehne wala koi bhi ${SITE.minAge} saal ya us se zyada umar ka shakhs. Ek insaan, ek account.` },
  { q: "Kitne ka match hota hai?", a: "Entry Rs 20, 50, 100 ya 500. Jeetne wale ko dono entries ka pot milta hai, platform fee kaat kar — maslan Rs 50 entry par Rs 90." },
  { q: "Agar koi muqabil na mile to?", a: "30 second tak asli player dhoonda jata hai. Na mile to app khud \"Computer\" ban kar aap ke saath khelti hai (Rs 100 tak ki entry par) aur aap ke muqable mein utni hi raqam lagati hai. Computer hamesha saaf naam aur robot icon ke saath dikhta hai — kabhi insaan ban kar nahi." },
  { q: "Computer kitna strong hai?", a: "Computer har player ke liye ek jaisa hai — taqreeban 65% sawal sahi karta hai aur 2.5 se 7 second mein jawab deta hai. Tafseel Fair Play page par hai." },
  { q: "Draw ho jaye to?", a: "Dono players ki poori entry wapas wallet mein aa jati hai." },
  { q: "Paise kaise nikalein?", a: "Wallet → Nikalwayein. Easypaisa, JazzCash ya bank account chunein. Kam az kam Rs 200. Pehli dafa CNIC verification ho sakti hai." },
  { q: "Agar beech match internet chala jaye?", a: "Match chalta rehta hai. Wapas aane par aap usi match mein laut aate hain. Jo sawal miss hue un par 0 points." },
  { q: "Sawal kahan se aate hain?", a: "Hamari team aur AI milkar sawal banate hain, aur har sawal ek alag fact-check se guzarta hai. Phir bhi koi ghalti nazar aaye to humein batayein — sahi sabit hone par match ka faisla dobara dekha jata hai." },
  { q: "Kya cheating ho sakti hai?", a: "Sahi jawab aur timer hamare server par rehte hain, browser mein nahi. Multiple accounts, bots ya mil kar khelna mana hai aur account band ho sakta hai." },
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
