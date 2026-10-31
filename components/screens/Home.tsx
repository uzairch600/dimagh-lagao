import { Gamepad2, Plus } from "lucide-react";
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
        <button className="balance-pill" onClick={() => go("wallet")}>
          <span className="coin">₨</span>
          <b>{user.balance.toLocaleString("en-PK")}</b>
          <span className="plus">
            <Plus size={16} strokeWidth={3} />
          </span>
        </button>
      </header>

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
