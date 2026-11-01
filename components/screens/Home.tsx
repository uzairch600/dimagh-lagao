import { Clock, Gamepad2, Plus, Timer, Trophy, Zap } from "lucide-react";
import { rs } from "@/lib/api";
import type { Config, Screen, User } from "@/lib/types";
import Avatar from "../Avatar";
import LiveFeed from "../LiveFeed";

type Props = { user: User; config: Config; go: (s: Screen) => void };

// Home = the player's scoreboard and what's happening live. Playing lives on "Khelein".
export default function Home({ user, config, go }: Props) {
  const played = user.wins + user.losses + user.draws;
  const rate = played ? Math.round((user.wins / played) * 100) : 0;
  const maxPrize = Math.max(...config.tiers.map((t) => t.prize));

  return (
    <section className="screen dash">
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
          <span className="tag">{config.paymentsOpen ? "LIVE 1v1" : "FREE PRACTICE"}</span>
          <h2>
            Aaj kis ko <span className="gold">harana</span> hai?
          </h2>
          {config.paymentsOpen ? (
            <p>Category chunein, muqabil se milein, aur {rs(maxPrize)} tak jeetein.</p>
          ) : (
            // until the payment gateway is connected: say so plainly, so nobody thinks the site is broken
            <p>
              <b>Paid matches jald aa rahe hain</b> — tab {rs(maxPrize)} tak jeet sakenge. Abhi free practice khelein aur dimagh tez
              karein.
            </p>
          )}
          <div className="home-hero-chips">
            <span><Zap size={14} /> {config.questions} sawal</span>
            <span><Timer size={14} /> {config.seconds} sec har sawal</span>
            {config.paymentsOpen ? (
              <span><Trophy size={14} /> {rs(maxPrize)} tak</span>
            ) : (
              <span><Clock size={14} /> Paid matches: jald</span>
            )}
          </div>
        </div>
        <img className="home-hero-art" src="/images/hero.webp" alt="" width={1408} height={768} />
      </div>

      <div className="dash-simple">
        <div className="my-stats card glass">
          <div><b className="green">{user.wins}</b><small>Jeet</small></div>
          <div><b className="red">{user.losses}</b><small>Haar</small></div>
          <div><b>{rate}%</b><small>Win rate</small></div>
        </div>

        <LiveFeed config={config} />

        <button className="btn btn-gold btn-block dash-play" onClick={() => go("play")}>
          <Gamepad2 size={20} /> Khelna shuru karein
        </button>
      </div>
    </section>
  );
}
