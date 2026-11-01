import { Gamepad2, Puzzle, Timer, Trophy, Users, Zap } from "lucide-react";
import type { Config, Screen, User } from "@/lib/types";
import Avatar from "../Avatar";
import LiveFeed from "../LiveFeed";

type Props = { user: User; config: Config; go: (s: Screen) => void };

// Home = the player's scoreboard and what's happening live. Playing lives on "Khelein".
export default function Home({ user, config, go }: Props) {
  const played = user.wins + user.losses + user.draws;
  const rate = played ? Math.round((user.wins / played) * 100) : 0;

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
        <button className="balance-pill" onClick={() => go("leaderboard")} aria-label="Leaderboard">
          <span className="coin">
            <Trophy size={15} />
          </span>
          <b>{user.wins}</b>
          <small>jeet</small>
        </button>
      </header>

      <div className="home-hero">
        <div className="home-hero-copy">
          <span className="tag">LIVE 1v1 • FREE</span>
          <h2>
            Aaj kis ko <span className="gold">harana</span> hai?
          </h2>
          <p>Category chunein, asli player se muqabla karein, aur leaderboard par sab se upar aayein — bilkul free.</p>
          <div className="home-hero-chips">
            <span><Users size={14} /> Asli players</span>
            <span><Zap size={14} /> {config.questions} sawal</span>
            <span><Timer size={14} /> {config.seconds} sec har sawal</span>
            <span><Puzzle size={14} /> {user.puzzles} puzzle hal</span>
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
