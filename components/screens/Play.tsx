import { ArrowRight, Plus, Timer, Trophy, Zap } from "lucide-react";
import { rs } from "@/lib/api";
import type { Category, Config, Screen, User } from "@/lib/types";
import Avatar from "../Avatar";
import CategoryIcon from "../CategoryIcon";

type Props = { user: User; config: Config; go: (s: Screen) => void; onPick: (c: Category) => void };

const BLURB: Record<string, string> = {
  world: "Pakistan aur duniya",
  cricket: "Records aur legends",
  science: "Jism, space, tech",
  math: "Sab se tez hisaab",
  it: "Computer aur internet",
  ai: "Robots aur machine learning",
  entertainment: "Films, dramas, music",
};

export default function Play({ user, config, go, onPick }: Props) {
  const maxPrize = Math.max(...config.tiers.map((t) => t.prize));

  return (
    <section className="screen home">
      <header className="topbar">
        <button className="me-chip" onClick={() => go("profile")}>
          <Avatar name={user.name} avatar={user.avatar} size="sm" />
          <span>
            <small>Khush aamdeed</small>
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

      <div className="home-hero">
        <div className="home-hero-copy">
          <span className="tag">LIVE 1v1</span>
          <h2>
            Aaj kis ko <span className="gold">harana</span> hai?
          </h2>
          <p>Category chunein, muqabil se milein, aur {rs(maxPrize)} tak jeetein.</p>
          <div className="home-hero-chips">
            <span><Zap size={14} /> {config.questions} sawal</span>
            <span><Timer size={14} /> {config.seconds} sec har sawal</span>
            <span><Trophy size={14} /> {rs(maxPrize)} tak</span>
          </div>
        </div>
        <img className="home-hero-art" src="/images/hero.webp" alt="" width={1408} height={768} />
      </div>

      <div className="play-cats">
        <div>
          <div className="section-head">
            <h3>Categories</h3>
            <span className="muted small">{config.categories.length} maidan</span>
          </div>
          <div className="cat-grid2">
            {config.categories.map((c) => (
              <button key={c.id} className="cat2" onClick={() => onPick(c)}>
                <CategoryIcon id={c.id} name={c.name} className="cat2-art" />
                <span className="cat2-body">
                  <b>{c.name}</b>
                  <small>{BLURB[c.id] ?? ""}</small>
                </span>
                <span className="cat2-go">
                  Khelein <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
