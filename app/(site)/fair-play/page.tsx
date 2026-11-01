import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Clock, HeartHandshake, ShieldCheck } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fair Play & Responsible Gaming",
  description: "Dimagh Lagao par muqabla kaise imaandar rehta hai, Puzzle Challenge ki tafseel, aur zimmedari se khelna.",
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
            <div className="side-card"><Bot size={22} /><b>Sirf asli muqabil</b><p>Paid quiz hamesha do insaanon ke beech.</p></div>
            <div className="side-card"><HeartHandshake size={22} /><b>Had mein khelein</b><p>Sirf {SITE.minAge}+, aur sirf utna jitna afford kar sakein.</p></div>
          </div>

          <div className="prose">
            <h2>Match kaise imaandar rehta hai</h2>
            <ul>
              <li>Sahi jawab aap ke phone par nahi bheja jata — sirf tab dikhaya jata hai jab dono jawab de chuke hon ya waqt khatam ho.</li>
              <li>Jawab ka waqt server naapta hai, is liye timer se chhed-chhaar ka faida nahi.</li>
              <li>Sawal AI aur team milkar banate hain, aur har sawal ek alag fact-check se guzarta hai. Ghalti mile to humein batayein.</li>
              <li>Ek se zyada account, bots ya mil kar khelna pakda jata hai aur account band ho sakta hai.</li>
              <li>Match ke dauran tab ya window badalna, full screen se nikalna, devtools kholna ya browser extension chalana cheating hai. Cheating pakdi gayi to wo player foran haar jata hai aur muqabil jeet jata hai. Dono ne ki to dono haarte hain aur dono entries platform rakhta hai.</li>
              <li>Sahi jawab aap ke jawab dene ke baad hi server se aata hai, aur har player ko options alag tarteeb mein milte hain.</li>
              <li>Har sawal 10 second ka hai aur der se diye gaye sahi jawab ke points kam hote hain — kisi aur se poochh kar jawab dena faida nahi deta.</li>
              <li>Paid match mein jeetne wale ka pattern ghair-mamooli ho (taqreeban sab sahi magar hamesha der se, ya har match mein ek jaisi timing) to inaam review ke baad milta hai. Saaf jeet ka inaam foran milta hai.</li>
            </ul>

            <h2>Puzzle Challenge</h2>
            <p>
              Paid quiz hamesha do asli players ke beech hota hai — app kabhi computer ban kar aap ke khilaf nahi khelti. Agar 30
              second mein koi muqabil na mile, to aap ko <b>Puzzle Challenge</b> milta hai: ek puzzle aur 35–90 second (puzzle ke hisaab se).
            </p>
            <ul>
              <li>Waqt ke andar puzzle sahi hal kiya to match ka poora inaam aap ka (inaam app deti hai).</li>
              <li>Waqt khatam aur puzzle hal nahi hua, to entry wapas nahi milti.</li>
              <li>Puzzle har player ke liye random chuna jata hai aur server khud check karta hai ke hal sahi hai.</li>
              <li>Match ke beech chale gaye aur 10 second mein wapas na aaye, to aap haar jate hain aur entry wapas nahi milti.</li>
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
