"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Gamepad2, Plus, Target, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { api, rs } from "@/lib/api";
import type { Config, MatchSummary, Screen, User } from "@/lib/types";
import Avatar from "../Avatar";
import CategoryIcon from "../CategoryIcon";
import LiveFeed from "../LiveFeed";

type Props = { user: User; config: Config; go: (s: Screen) => void };

const when = (t: number) => new Date(t).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// Home = the player's analytics. Playing lives on the separate "Khelein" screen.
export default function Home({ user, config, go }: Props) {
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);
  useEffect(() => {
    api<{ matches: MatchSummary[] }>("/api/matches")
      .then((d) => setMatches(d.matches))
      .catch(() => setMatches([]));
  }, []);

  const played = user.wins + user.losses + user.draws;
  const rate = played ? Math.round((user.wins / played) * 100) : 0;
  const pct = (n: number) => (played ? (n / played) * 100 : 0);
  const catName = (id: string) => config.categories.find((c) => c.id === id)?.name ?? id;

  const byCategory = config.categories
    .map((c) => {
      const ms = (matches ?? []).filter((m) => m.category === c.id);
      return { c, played: ms.length, wins: ms.filter((m) => m.winner === user.id).length };
    })
    .filter((x) => x.played > 0)
    .sort((a, b) => b.played - a.played);

  const kpis = [
    { icon: Wallet, label: "Wallet", value: rs(user.balance), tone: "gold", onClick: () => go("wallet") },
    {
      icon: user.earnings >= 0 ? TrendingUp : TrendingDown,
      label: "Kul kamai",
      value: `${user.earnings >= 0 ? "+" : "−"}${rs(Math.abs(user.earnings))}`,
      tone: user.earnings >= 0 ? "green" : "red",
    },
    { icon: Gamepad2, label: "Matches", value: String(played), tone: "violet" },
    { icon: Target, label: "Win rate", value: `${rate}%`, tone: "pink" },
  ];

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

      <div className="dash-head">
        <div>
          <h2 className="page-title">Aap ka scoreboard</h2>
          <p className="muted">Har match ka hisaab, ek nazar mein.</p>
        </div>
        <button className="btn btn-gold" onClick={() => go("play")}>
          <Gamepad2 size={18} /> Khelna shuru karein
        </button>
      </div>

      <div className="kpis">
        {kpis.map(({ icon: Icon, label, value, tone, onClick }) => (
          <button key={label} className={`kpi ${tone}`} onClick={onClick} disabled={!onClick} type="button">
            <span className="kpi-icon"><Icon size={20} /></span>
            <small>{label}</small>
            <b>{value}</b>
          </button>
        ))}
      </div>

      <div className="dash-grid">
        <div className="card glass dash-card">
          <h4>Jeet / Haar</h4>
          {played === 0 ? (
            <p className="muted small">Abhi koi paid match nahi khela.</p>
          ) : (
            <>
              <div className="wl-bar">
                <i className="w" style={{ width: `${pct(user.wins)}%` }} />
                <i className="d" style={{ width: `${pct(user.draws)}%` }} />
                <i className="l" style={{ width: `${pct(user.losses)}%` }} />
              </div>
              <div className="wl-legend">
                <span><i className="w" /> Jeet <b>{user.wins}</b></span>
                <span><i className="d" /> Barabar <b>{user.draws}</b></span>
                <span><i className="l" /> Haar <b>{user.losses}</b></span>
              </div>
            </>
          )}
        </div>

        <div className="card glass dash-card">
          <h4>Category performance</h4>
          {byCategory.length === 0 ? (
            <p className="muted small">Pehla match khelein, yahan har category ka hisaab aayega.</p>
          ) : (
            <div className="cat-perf">
              {byCategory.map(({ c, played: n, wins }) => (
                <div key={c.id} className="cat-perf-row">
                  <CategoryIcon id={c.id} name={c.name} />
                  <span className="cp-name">
                    <b>{c.name}</b>
                    <span className="cp-bar"><i style={{ width: `${(wins / n) * 100}%` }} /></span>
                  </span>
                  <span className="cp-num">{wins}/{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card glass dash-card">
          <div className="dash-card-head">
            <h4>Pichle matches</h4>
            <button className="link-btn" onClick={() => go("profile")}>Sab dekhein <ArrowRight size={14} /></button>
          </div>
          {matches === null && <p className="muted small">Load ho raha hai…</p>}
          {matches?.length === 0 && <p className="muted small">Abhi koi match nahi.</p>}
          <div className="recent">
            {matches?.slice(0, 5).map((m) => {
              const me = m.players.find((p) => p.userId === user.id);
              const opp = m.players.find((p) => p.userId !== user.id);
              const outcome = !m.winner ? "draw" : m.winner === user.id ? "win" : "loss";
              return (
                <div key={m.id} className="recent-row">
                  <span className={`badge-outcome ${outcome}`}>{outcome === "win" ? "W" : outcome === "loss" ? "L" : "D"}</span>
                  <span className="recent-info">
                    <b>vs {opp?.name}</b>
                    <small>{catName(m.category)} • {me?.score}–{opp?.score} • {when(m.at)}</small>
                  </span>
                  {m.mode !== "practice" && (
                    <span className={`amt ${outcome === "win" ? "plus" : outcome === "loss" ? "minus" : ""}`}>
                      {outcome === "win" ? `+${m.prize}` : outcome === "loss" ? `−${m.entry}` : "±0"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="dash-live">
          <LiveFeed config={config} />
        </div>
      </div>
    </section>
  );
}
