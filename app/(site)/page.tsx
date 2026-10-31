import Link from "next/link";
import { ArrowRight, Bot, Clock, Lock, ShieldCheck, Smartphone, Swords, Trophy, Users, Wallet } from "lucide-react";
import { LiveStrip, WinnersList } from "@/components/site/Live";
import CategoryIcon from "@/components/CategoryIcon";
import { SITE } from "@/lib/site";

const CATEGORIES = [
  { id: "world", name: "World GK", desc: "Pakistan aur duniya" },
  { id: "cricket", name: "Cricket", desc: "Records, legends, rules" },
  { id: "science", name: "Science", desc: "Jism, space, technology" },
  { id: "math", name: "Math Speed", desc: "Sab se tez hisaab" },
  { id: "it", name: "IT & Computers", desc: "Computer, internet, coding" },
  { id: "ai", name: "AI", desc: "Machine learning, robots" },
  { id: "entertainment", name: "Entertainment", desc: "Films, dramas, music" },
  { id: "crowns", name: "Taaj (puzzle)", desc: "Har row, column aur rang mein ek taaj" },
  { id: "sunmoon", name: "Suraj Chaand (puzzle)", desc: "Suraj aur chaand ka sahi jor" },
  { id: "path", name: "Number Raasta (puzzle)", desc: "1, 2, 3… jorein, har khana bharein" },
  { id: "maze", name: "Bhool Bhulaiyan (puzzle)", desc: "Rocket ko jhande tak pohanchayein" },
];

const STEPS = [
  { icon: Smartphone, title: "Account banayein", text: "Sirf mobile number aur 4-digit PIN. 30 second ka kaam." },
  { icon: Wallet, title: "Category aur entry chunein", text: "Rs 20 se Rs 500 tak. Jitni entry, utna bada inaam." },
  { icon: Swords, title: "Live 1v1 muqabla", text: "Dono players ko same 10 sawal. Jitna tez sahi jawab, utne zyada points." },
  { icon: Trophy, title: "Inaam jeetein", text: "Jeetne wale ko poora inaam foran wallet mein." },
];

const FEATURES = [
  { icon: Users, title: "Asli players", text: "Aap ka muqabla asli logon se hota hai. Agar 30 second mein koi na mile, to app khud aap ke saath khelti hai — saaf likh kar." },
  { icon: Clock, title: "Server ki ghari", text: "Waqt aur sahi jawab hamare server par rehte hain — koi cheat nahi kar sakta." },
  { icon: Lock, title: "Mehfooz account", text: "PIN encrypted rehta hai, aur har paisa wallet history mein dikhta hai." },
  { icon: ShieldCheck, title: "Saaf hisaab", text: `Platform fee ${SITE.platformFeePercent}%, har match se pehle saaf likhi hui. Baqi ${100 - SITE.platformFeePercent}% jeetne wale ka.` },
];

export default function Landing() {
  return (
    <>
      {/* HERO */}
      <section className="hero-section">
        <div className="site-container hero-grid">
          <div className="hero-copy">
            <span className="pill">
              <span className="live-dot" /> Pakistan ka live 1v1 quiz muqabla
            </span>
            <h1>
              Dimagh lagao,
              <br />
              <span className="grad-gold">inaam jeeto.</span>
            </h1>
            <p className="lead">
              Asli players ke saath live quiz battle. Pakistan aur duniya ki GK, cricket, science, IT, AI, entertainment, aur 1v1 puzzles — jo sahi aur sab se tez jawab de,
              wohi jeete. <b>Rs 700 tak</b> ek match mein.
            </p>
            <div className="hero-ctas">
              <Link href="/play" className="btn btn-gold btn-lg">
                Abhi khelein <ArrowRight size={20} />
              </Link>
              <Link href="/how-to-play" className="btn btn-ghost btn-lg">
                Kaise khelein?
              </Link>
            </div>
            <ul className="hero-points">
              <li><ShieldCheck size={16} /> Skill game — qismat nahi</li>
              <li><Clock size={16} /> 2 minute ka match</li>
              <li><Smartphone size={16} /> Mobile aur desktop dono par</li>
            </ul>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <img className="hero-art-img" src="/images/hero.webp" alt="" width={1408} height={768} />
            <div className="float-card fc1">
              <Trophy size={18} /> <span><b>+Rs 70</b> jeeta</span>
            </div>
            <div className="float-card fc2">
              <Bot size={18} /> <span>30s mein player na mile to <b>Puzzle Challenge</b></span>
            </div>
          </div>
        </div>
        <div className="site-container">
          <LiveStrip />
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

      {/* PRIZES */}
      <section className="site-section">
        <div className="site-container prize-band">
          <div>
            <p className="eyebrow">Inaam</p>
            <h2>Entry chhoti, inaam bada</h2>
            <p className="muted">Dono players ki entry milkar pot banti hai. {100 - SITE.platformFeePercent}% jeetne wale ka.</p>
          </div>
          <div className="prize-table">
            {[20, 50, 100, 500].map((e) => (
              <div key={e} className={`prize-row ${e === 50 ? "hot" : ""}`}>
                <span>Entry <b>Rs {e}</b></span>
                <ArrowRight size={18} />
                <span className="gold">Jeeto <b>Rs {Math.round(e * 2 * (1 - SITE.platformFeePercent / 100))}</b></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="site-section alt">
        <div className="site-container">
          <div className="section-title">
            <p className="eyebrow">Kyun Dimagh Lagao?</p>
            <h2>Imaandar muqabla, saaf hisaab</h2>
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
              <p className="eyebrow">Live winners</p>
              <h2>Abhi abhi kisne jeeta</h2>
            </div>
            <Link href="/winners" className="text-link">
              Sab winners <ArrowRight size={16} />
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
              <p>Free practice se shuru karein, phir asli muqabla khelein.</p>
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
