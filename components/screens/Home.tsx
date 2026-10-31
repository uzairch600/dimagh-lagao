import { Plus, Swords } from "lucide-react";
import { rs } from "@/lib/api";
import type { Category, Config, Screen, User } from "@/lib/types";
import Avatar from "../Avatar";
import CategoryIcon from "../CategoryIcon";
import LiveFeed from "../LiveFeed";

type Props = { user: User; config: Config; go: (s: Screen) => void; onPick: (c: Category) => void };

const BLURB: Record<string, string> = {
  world: "Pakistan aur duniya: tareekh, jughrafia",
  cricket: "Records, legends, rules",
  science: "Jism, space, technology",
  math: "Tez hisaab — sab se fast jeete",
  it: "Computer, internet, coding",
  ai: "Machine learning, robots, AI tareekh",
  entertainment: "Films, dramas, music, games",
};

export default function Home({ user, config, go, onPick }: Props) {
  const maxPrize = Math.max(...config.tiers.map((t) => t.prize));
  return (
    <section className="screen">
      <header className="topbar">
        <button className="me-chip" onClick={() => go("profile")}>
          <Avatar name={user.name} avatar={user.avatar} size="sm" />
          <span>
            <small>Assalam o Alaikum</small>
            <b>{user.name}</b>
          </span>
        </button>
        <button className="balance-pill" onClick={() => go("wallet")}>
          <span className="coin">₨</span>
          <b>{user.balance.toLocaleString("en-PK")}</b>
          <span className="plus">
            <Plus size={16} strokeWidth={3} />
          </span>
        </button>
      </header>

      <div className="hero card">
        <div className="hero-text">
          <span className="tag">LIVE 1v1</span>
          <h2>
            Dimagh lagao,
            <br />
            <span className="gold">{rs(maxPrize)} tak jeeto</span>
          </h2>
          <p>
            {config.questions} sawal • {config.seconds} second • jo tez aur sahi, wohi jeete
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <Swords size={64} strokeWidth={1.6} />
        </div>
      </div>

      <div className="home-layout">
      <aside className="home-aside">
        <LiveFeed config={config} />
      </aside>

      <div className="home-main">
      <div className="section-head">
        <h3>Category chunein</h3>
        <span className="urdu muted">زمرہ</span>
      </div>
      <div className="cat-grid">
        {config.categories.map((c, i) => {
          const wide = i === config.categories.length - 1 && config.categories.length % 2 === 1;
          return (
            <button key={c.id} className={`cat ${wide ? "wide" : ""}`} onClick={() => onPick(c)}>
              <CategoryIcon id={c.id} name={c.name} />
              <span>
                <b>{c.name}</b>
                <small>{BLURB[c.id] ?? ""}</small>
              </span>
              <span className="urdu">{c.urdu}</span>
            </button>
          );
        })}
      </div>

      <div className="how card glass">
        <h4>Kaise khelein?</h4>
        <ol>
          <li><b>Category</b> aur <b>entry fee</b> chunein</li>
          <li>App aap ko kisi asli player se milaati hai — <b>30 second</b> mein koi na mile to app khud aap ke saath khelti hai</li>
          <li>Dono ko <b>same sawal</b> — sahi + tez jawab = zyada points</li>
          <li>Jeetne wale ko <b className="gold">poora inaam</b> wallet mein</li>
        </ol>
      </div>
      </div>
      </div>
    </section>
  );
}
