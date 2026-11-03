import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, Gift, Puzzle, Target, Timer, Trophy } from "lucide-react";
import PageHero from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Kaise khelein",
  description: "Dimagh Lagao kaise khelein — account, free 1v1 quiz match, 20 puzzles, scoring aur leaderboard ki poori tafseel.",
};

export default function HowToPlay() {
  return (
    <>
      <PageHero eyebrow="Guide" title="Kaise khelein?" sub="Do minute ka match, das sawal, ek winner — aur sab kuch free. Yahan tafseel se." />
      <section className="site-section">
        <div className="site-container prose-grid">
          <article className="prose">
            <h2>1. Account banayein</h2>
            <p>
              <Link href="/play">Play</Link> page par apna mobile number likhein, naam aur 4-digit PIN banayein. Bas. Agli baar
              isi number aur PIN se login karein. Ek insaan sirf ek account bana sakta hai.
            </p>

            <h2>2. Category chunein</h2>
            <p>
              7 quiz categories (World GK, Cricket, Science, Math, IT, AI, Entertainment) aur 20 puzzles. Har match{" "}
              <b>bilkul free</b> hai — koi entry fee nahi, koi paisa nahi lagta.
            </p>

            <h2>3. Muqabil se match</h2>
            <p>
              App aap ko usi category ke kisi asli player se milaati hai. Agar <b>30 second</b> mein koi player na mile, to computer aap
              ke saath khelta hai. Lobby mein &quot;Wapas&quot; daba kar kabhi bhi nikal sakte hain.
            </p>

            <h2>4. Scoring</h2>
            <p>Dono players ko bilkul same 10 sawal, same order mein milte hain. Har sawal ke liye 10 second.</p>
            <ul>
              <li><b>Sahi jawab 2 second ke andar:</b> 100 points</li>
              <li><b>Us ke baad:</b> har second ke saath kam, aakhri second par 10 points</li>
              <li><b>Ghalat ya time khatam:</b> 0 points</li>
            </ul>
            <p>10 sawal ke baad jiske points zyada, wohi jeeta. Asli player se har jeet leaderboard par ginti hai.</p>

            <h2>Puzzles</h2>
            <p>
              Khelein mein Quiz ke saath 20 puzzles bhi hain — <b>Taaj</b>, <b>Sudoku</b>, <b>Lafz Dhoondo</b>, <b>Gend Tarteeb</b>,{" "}
              <b>Hisaab Jor</b>, <b>Pipe Jor</b> aur bohat se aur. Puzzle akele khela jata hai — koi muqabil nahi: 1 puzzle, 35–90
              second (puzzle ke hisaab se). Board poora sahi hote hi server check karta hai — waqt par hal kiya to leaderboard par ek
              puzzle aur jud jata hai. Har puzzle card par &quot;Kaise khelein&quot; dabayein: ek haath puzzle hal kar ke dikhata hai,
              phir aap chhote puzzle par khud practice kar sakte hain.
            </p>

            <h2>5. Leaderboard aur sponsor muqable</h2>
            <p>
              Leaderboard par asli players se jeet aur waqt par hal kiye puzzles gine jaate hain. Jald hi brands aur sponsors apne
              muqable karwayenge — aap free khelenge, aur inaam sponsor dega. Aap ka ek paisa bhi daao par nahi lagta.
            </p>
          </article>

          <aside className="side-cards">
            <div className="side-card"><Timer size={22} /><b>10 sawal × 10 second</b><p>Poora match taqreeban 2 minute.</p></div>
            <div className="side-card"><Target size={22} /><b>Sahi + tez = jeet</b><p>Jitna tez sahi jawab, utne zyada points.</p></div>
            <div className="side-card"><Bot size={22} /><b>30 second rule</b><p>Player na mile to computer khelta hai.</p></div>
            <div className="side-card"><Puzzle size={22} /><b>20 puzzles</b><p>Har ek ka live demo aur practice.</p></div>
            <div className="side-card"><Gift size={22} /><b>Bilkul free</b><p>Koi entry fee nahi, koi jua nahi.</p></div>
            <Link href="/play" className="btn btn-gold btn-block">
              <Trophy size={18} /> Abhi khelein <ArrowRight size={18} />
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
