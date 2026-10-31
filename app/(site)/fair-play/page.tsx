import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Clock, HeartHandshake, ShieldCheck } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fair Play & Responsible Gaming",
  description: "Dimagh Lagao par muqabla kaise imaandar rehta hai, computer opponent ki tafseel, aur zimmedari se khelna.",
};

export default function FairPlay() {
  return (
    <>
      <PageHero eyebrow="Trust" title="Fair Play & Responsible Gaming" sub="Har match imaandar ho — aur khel, khel hi rahe." />
      <section className="site-section">
        <div className="site-container narrow">
          <img className="page-art" src="/images/fair-play.webp" alt="" width={640} height={640} />
          <div className="fair-cards">
            <div className="side-card"><ShieldCheck size={22} /><b>Same sawal</b><p>Dono players ko bilkul same sawal, same order.</p></div>
            <div className="side-card"><Clock size={22} /><b>Server ki ghari</b><p>Timer aur sahi jawab server par — browser mein nahi.</p></div>
            <div className="side-card"><Bot size={22} /><b>Computer hamesha labelled</b><p>Kabhi insaan ban kar nahi khelta.</p></div>
            <div className="side-card"><HeartHandshake size={22} /><b>Had mein khelein</b><p>Sirf {SITE.minAge}+, aur sirf utna jitna afford kar sakein.</p></div>
          </div>

          <div className="prose">
            <h2>Match kaise imaandar rehta hai</h2>
            <ul>
              <li>Sahi jawab aap ke phone par nahi bheja jata — sirf tab dikhaya jata hai jab dono jawab de chuke hon ya waqt khatam ho.</li>
              <li>Jawab ka waqt server naapta hai, is liye timer se chhed-chhaar ka faida nahi.</li>
              <li>Sawal AI aur team milkar banate hain, aur har sawal ek alag fact-check se guzarta hai. Ghalti mile to humein batayein.</li>
              <li>Ek se zyada account, bots ya mil kar khelna pakda jata hai aur account band ho sakta hai.</li>
            </ul>

            <h2>Computer opponent</h2>
            <p>
              Agar 30 second mein koi asli player na mile, to Rs 100 tak ki entry par app khud &quot;Computer&quot; ban kar aap ke
              saath khelti hai. Us match mein app aap ke muqable mein utni hi entry lagati hai, aur aap jeetein to inaam app deti
              hai.
            </p>
            <ul>
              <li>Computer hamesha &quot;Computer&quot; naam aur robot icon ke saath dikhta hai.</li>
              <li>Us ki taqat sab ke liye ek jaisi aur fix hai: taqreeban <b>65% sawal sahi</b>, jawab <b>2.5 se 7 second</b> mein.</li>
              <li>Computer ke paas sahi jawab pehle se nahi hota jo aap ke khilaf istemal ho — wo bas apni fix accuracy par khelta hai.</li>
              <li>Agar aap match ke beech chale jayein, to match poora khela jata hai — jaldi nikal kar faida nahi uthaya ja sakta.</li>
            </ul>

            <h2>Zimmedari se khelein</h2>
            <ul>
              <li>Sirf wohi paise lagayein jinka nuqsan aap bardasht kar sakein.</li>
              <li>Haar ke baad &quot;wapas jeetne&quot; ke liye entry mat barhayein.</li>
              <li>Waqt ki had rakhein — khel tafreeh ke liye hai, kamai ka zariya nahi.</li>
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
