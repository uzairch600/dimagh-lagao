import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Clock, HeartHandshake, ShieldCheck } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fair Play",
  description: "Dimagh Lagao par muqabla kaise imaandar rehta hai, aur sehatmand had mein khelna.",
};

export default function FairPlay() {
  return (
    <>
      <PageHero eyebrow="Trust" title="Fair Play" sub="Har match imaandar ho — aur khel, khel hi rahe." />
      <section className="site-section">
        <div className="site-container narrow">
          <img className="page-art" src="/images/fair-play.webp" alt="" width={640} height={640} />
          <div className="fair-cards">
            <div className="side-card"><ShieldCheck size={22} /><b>Same sawal</b><p>Dono players ko bilkul same sawal, same order.</p></div>
            <div className="side-card"><Clock size={22} /><b>Server ki ghari</b><p>Timer aur sahi jawab server par — browser mein nahi.</p></div>
            <div className="side-card"><Bot size={22} /><b>Computer saaf likha</b><p>Computer khele to hamesha &quot;Computer&quot; likha hota hai.</p></div>
            <div className="side-card"><HeartHandshake size={22} /><b>Koi jua nahi</b><p>Har match free — kisi ka paisa daao par nahi.</p></div>
          </div>

          <div className="prose">
            <h2>Match kaise imaandar rehta hai</h2>
            <ul>
              <li>Sahi jawab aap ke phone par nahi bheja jata — sirf tab dikhaya jata hai jab dono jawab de chuke hon ya waqt khatam ho.</li>
              <li>Jawab ka waqt server naapta hai, is liye timer se chhed-chhaar ka faida nahi.</li>
              <li>Sawal AI aur team milkar banate hain, aur har sawal ek alag fact-check se guzarta hai. Ghalti mile to humein batayein.</li>
              <li>Ek se zyada account, bots ya mil kar khelna pakda jata hai aur account band ho sakta hai.</li>
              <li>Match ke dauran tab ya window badalna, full screen se nikalna, devtools kholna ya browser extension chalana cheating hai. Cheating pakdi gayi to wo player foran haar jata hai aur muqabil jeet jata hai. Dono ne ki to dono haarte hain.</li>
              <li>Har player ko options alag tarteeb mein milte hain, is liye &quot;option B&quot; bata kar madad nahi ki ja sakti.</li>
              <li>Har sawal 10 second ka hai aur der se diye gaye sahi jawab ke points kam hote hain — kisi aur se poochh kar jawab dena faida nahi deta.</li>
              <li>Jawabon ki timing ka server khud jaiza leta hai. Ghair-mamooli pattern (maslan har jawab bilkul ek jaise waqt par) note hota hai, taa ke leaderboard aur sponsor muqable imaandar rahein.</li>
            </ul>

            <h2>Puzzles</h2>
            <ul>
              <li>Puzzle akele khela jata hai: ek board aur 35–90 second (puzzle ke hisaab se).</li>
              <li>Har board server banata hai aur server hi check karta hai ke hal sahi hai.</li>
              <li>Waqt par hal kiya to leaderboard par ek puzzle aur jud jata hai.</li>
            </ul>

            <h2>Sehatmand had mein khelein</h2>
            <ul>
              <li>Sirf {SITE.minAge}+ players.</li>
              <li>Waqt ki had rakhein — khel tafreeh aur dimagh tez karne ke liye hai.</li>
              <li>
                Break chahiye ya account band karwana hai? <Link href="/contact">Humein message karein</Link> — hum aap ka account
                kuch waqt ya hamesha ke liye band kar denge.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
