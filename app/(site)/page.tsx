import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, Gift, Lock, Puzzle, ShieldCheck, Smartphone, Swords, Trophy, Users } from "lucide-react";
import { LiveStrip, WinnersList } from "@/components/site/Live";
import CategoryIcon from "@/components/CategoryIcon";

const CATEGORIES = [
  { id: "world", name: "World GK", desc: "Pakistan aur duniya" },
  { id: "cricket", name: "Cricket", desc: "Records, legends, rules" },
  { id: "science", name: "Science", desc: "Jism, space, technology" },
  { id: "math", name: "Math Speed", desc: "Sab se tez hisaab" },
  { id: "it", name: "IT & Computers", desc: "Computer, internet, coding" },
  { id: "ai", name: "AI", desc: "Machine learning, robots" },
  { id: "entertainment", name: "Entertainment", desc: "Films, dramas, music" },
  { id: "crowns", name: "Taaj (puzzle)", desc: "Har row, column aur rang mein ek taaj" },
  { id: "words", name: "Lafz Dhoondo (puzzle)", desc: "Chhupe hue lafz dhoondein" },
  { id: "balls", name: "Gend Tarteeb (puzzle)", desc: "Har nali mein ek rang — aur 17 puzzle aur" },
  { id: "target", name: "Hisaab Jor (puzzle)", desc: "Numbers jor tor kar target banayein" },
];

const STEPS = [
  { icon: Smartphone, title: "Account banayein", text: "Sirf mobile number aur 4-digit PIN. 30 second ka kaam." },
  { icon: Swords, title: "Category chunein", text: "7 quiz categories aur 20 puzzles — sab bilkul free. Koi entry fee nahi." },
  { icon: Users, title: "Live 1v1 muqabla", text: "Asli player ke saath same 10 sawal. Jitna tez sahi jawab, utne zyada points." },
  { icon: Trophy, title: "Champion banein", text: "Har jeet aur har hal kiya puzzle leaderboard par ginta hai." },
];

const FEATURES = [
  { icon: Users, title: "Asli players", text: "Aap ka muqabla asli logon se hota hai. 30 second mein koi na mile, to computer aap ke saath khelta hai — saaf likh kar." },
  { icon: Clock, title: "Server ki ghari", text: "Waqt aur sahi jawab hamare server par rehte hain — koi cheat nahi kar sakta." },
  { icon: Lock, title: "Mehfooz account", text: "PIN encrypted rehta hai. Aap ka number kisi ke saath share nahi hota." },
  { icon: ShieldCheck, title: "Koi jua nahi", text: "Khelna bilkul free hai. Aap ka ek paisa bhi daao par nahi lagta — sirf dimagh." },
];

export default function Landing() {
  return (
    <>
      {/* HERO */}
      <section className="hero-section">
        <div className="site-container hero-grid">
          <div className="hero-copy">
            <span className="pill">
              <span className="live-dot" /> Pakistan ka free 1v1 quiz muqabla
            </span>
            <h1>
              Dimagh lagao,
              <br />
              <span className="grad-gold">champion bano.</span>
            </h1>
            <p className="lead">
              Asli players ke saath live quiz battle. Pakistan aur duniya ki GK, cricket, science, IT, AI, entertainment, aur 20 dimaghi
              puzzles — jo sahi aur sab se tez jawab de, wohi jeete. <b>Bilkul free.</b>
            </p>
            <div className="hero-ctas">
              <Link href="/play" className="btn btn-gold btn-lg">
                Abhi khelein <ArrowRight size={20} />
              </Link>
              <Link href="/how-to-play" className="btn btn-ghost btn-lg">
                Kaise khelein?
              </Link>
            </div>
            <LiveStrip hero />
            <ul className="hero-points">
              <li><ShieldCheck size={16} /> Skill game — qismat nahi</li>
              <li><Clock size={16} /> 2 minute ka match</li>
              <li><Smartphone size={16} /> Mobile aur desktop dono par</li>
            </ul>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <img className="hero-art-img" src="/images/hero.webp" alt="" width={1408} height={768} />
            <div className="float-card fc1">
              <Trophy size={18} /> <span><b>+1 jeet</b> leaderboard par</span>
            </div>
            <div className="float-card fc2">
              <Puzzle size={18} /> <span><b>20 puzzles</b> — har ek ka live demo</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="site-section">
        <div className="site-container">
          <div className="section-title">
            <p className="eyebrow">Kaise kaam karta hai</p>
            <h2>4 qadam, aur aap muqable mein</h2>
          </div>
          <div className="steps">
            {STEPS.map(({ title, text }, i) => (
              <div key={title} className="step">
                <span className="step-num">{i + 1}</span>
                <img className="step-art" src={`/images/step-${i + 1}.webp`} alt="" width={480} height={480} loading="lazy" />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="site-section alt">
        <div className="site-container">
          <div className="section-title">
            <p className="eyebrow">Categories</p>
            <h2>Apni pasand ka maidan chunein</h2>
          </div>
          <div className="cat-cards">
            {CATEGORIES.map(({ id, name, desc }) => (
              <Link href="/play" key={id} className="cat-card">
                <CategoryIcon id={id} className="cat-card-art" />
                <h3>{name}</h3>
                <p>{desc}</p>
                <span className="cat-link">Khelein <ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SPONSORS */}
      <section className="site-section">
        <div className="site-container prize-band">
          <div>
            <p className="eyebrow">Sponsor muqable — jald aa rahe hain</p>
            <h2>Aap free khelein, inaam sponsor de</h2>
            <p className="muted">
              Brands aur sponsors apne muqable karwayenge aur inaam khud denge. Players se koi entry fee nahi — sab se behtar khelne wala
              inaam ka haqdar.
            </p>
          </div>
          <div className="prize-table">
            <div className="prize-row">
              <span><Gift size={18} /> <b>Inaam sponsor ki taraf se</b></span>
            </div>
            <div className="prize-row">
              <span><BadgeCheck size={18} /> <b>Players ke liye bilkul free</b></span>
            </div>
            <div className="prize-row hot">
              <span className="gold"><Trophy size={18} /> <b>Behtareen player jeetega</b></span>
            </div>
            <Link href="/contact" className="text-link">
              Sponsor banna hai? Rabta karein <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="site-section alt">
        <div className="site-container">
          <div className="section-title">
            <p className="eyebrow">Kyun Dimagh Lagao?</p>
            <h2>Imaandar muqabla, sirf dimagh ka khel</h2>
          </div>
          <div className="features">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="feature">
                <span className="feature-icon"><Icon size={24} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WINNERS */}
      <section className="site-section">
        <div className="site-container">
          <div className="section-title row">
            <div>
              <p className="eyebrow">Live nateeje</p>
              <h2>Abhi abhi kisne jeeta</h2>
            </div>
            <Link href="/winners" className="text-link">
              Sab nateeje <ArrowRight size={16} />
            </Link>
          </div>
          <WinnersList limit={6} />
        </div>
      </section>

      {/* CTA */}
      <section className="site-section">
        <div className="site-container">
          <div className="cta-band">
            <div className="cta-copy">
              <h2>Aap ka dimagh kitna tez hai?</h2>
              <p>Free account banayein aur pehla muqabla abhi khelein.</p>
              <Link href="/play" className="btn btn-gold btn-lg">
                Abhi khelein <ArrowRight size={20} />
              </Link>
            </div>
            <img className="cta-art" src="/images/cta.webp" alt="" width={1408} height={768} loading="lazy" />
          </div>
        </div>
      </section>
    </>
  );
}
