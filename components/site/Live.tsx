"use client";

// Live data widgets for the public website. Everything shown here comes from real matches.
import { useEffect, useState } from "react";
import { Activity, Puzzle, Swords, Trophy, Users } from "lucide-react";
import { api } from "@/lib/api";
import { GAME_LIVE } from "@/lib/site";
import type { LeaderRow } from "@/lib/types";
import Avatar from "../Avatar";

type Live = {
  online: number;
  playing: number;
  searching: number;
  matchesToday: number;
  // kind "win": a 1v1 won against a real player; "puzzle": a puzzle solved in time
  recent: { id: string; kind: "win" | "puzzle"; winner: string; avatar?: string; loser?: string; categoryName: string; at: number }[];
};

const ago = (t: number) => {
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s pehle`;
  if (s < 3600) return `${Math.floor(s / 60)} min pehle`;
  if (s < 86400) return `${Math.floor(s / 3600)} ghante pehle`;
  return `${Math.floor(s / 86400)} din pehle`;
};

// null = loading, "off" = no game server (static hosting or server down)
function useLive(intervalMs = 10000) {
  const [live, setLive] = useState<Live | "off" | null>(GAME_LIVE ? null : "off");
  useEffect(() => {
    if (!GAME_LIVE) return;
    const load = () => api<Live>("/api/live").then(setLive).catch(() => setLive((l) => (l && l !== "off" ? l : "off")));
    load();
    const t = setInterval(load, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return live;
}

const prelaunch = (
  <div className="site-empty">
    <Trophy size={32} />
    <p>Game launch hote hi taaza winners yahan live nazar aayenge.</p>
  </div>
);

// hero: the compact version that sits under the hero buttons (one row on phones too)
export function LiveStrip({ hero = false }: { hero?: boolean }) {
  const live = useLive();
  if (live === "off") return null;
  const items = [
    { icon: Users, value: live ? String(live.online) : "—", label: "Abhi online" },
    { icon: Swords, value: live ? String(live.playing) : "—", label: "Match khel rahe hain" },
    { icon: Activity, value: live ? String(live.matchesToday) : "—", label: "Aaj ke matches" },
  ];
  return (
    <div className={`live-strip ${hero ? "hero-live" : ""}`}>
      <span className="live-strip-tag">
        <span className="live-dot" /> LIVE
      </span>
      {items.map(({ icon: Icon, value, label }) => (
        <div key={label} className="live-strip-item">
          <Icon size={20} />
          <b>{value}</b>
          <small>{label}</small>
        </div>
      ))}
    </div>
  );
}

export function WinnersList({ limit = 12 }: { limit?: number }) {
  const live = useLive();
  if (live === "off") return prelaunch;
  if (!live) return <div className="site-empty">Load ho raha hai…</div>;
  if (!live.recent.length)
    return (
      <div className="site-empty">
        <Trophy size={32} />
        <p>Abhi tak koi winner nahi — pehli jeet aap ki ho sakti hai!</p>
      </div>
    );
  return (
    <div className="winners-grid">
      {live.recent.slice(0, limit).map((r) => (
        <div key={r.id} className="winner-card">
          <Avatar name={r.winner} avatar={r.avatar} />
          <div className="info">
            <b>{r.winner}</b>
            <small>
              {r.kind === "puzzle" ? `${r.categoryName} waqt par hal kiya` : `${r.categoryName} • ${r.loser} ko haraya`} • {ago(r.at)}
            </small>
          </div>
          <span className="won">{r.kind === "puzzle" ? <Puzzle size={20} /> : <Trophy size={20} />}</span>
        </div>
      ))}
    </div>
  );
}

export function LeaderboardTable() {
  const [rows, setRows] = useState<LeaderRow[] | null>(GAME_LIVE ? null : []);
  useEffect(() => {
    if (!GAME_LIVE) return;
    api<{ players: LeaderRow[] }>("/api/leaderboard")
      .then((d) => setRows(d.players))
      .catch(() => setRows([]));
  }, []);
  if (!GAME_LIVE) return prelaunch;
  if (!rows) return <div className="site-empty">Load ho raha hai…</div>;
  if (!rows.length)
    return (
      <div className="site-empty">
        <Trophy size={32} />
        <p>Leaderboard abhi khali hai. Pehla match khelein aur top par aa jayein!</p>
      </div>
    );
  return (
    <div className="lb-table">
      <div className="lb-head">
        <span>#</span>
        <span>Player</span>
        <span>Jeet</span>
        <span>Haar</span>
        <span>Puzzle</span>
      </div>
      {rows.map((p, i) => (
        <div key={p.id} className={`lb-line ${i < 3 ? `top${i + 1}` : ""}`}>
          <span className="rank">{i + 1}</span>
          <span className="who">
            <Avatar name={p.name} avatar={p.avatar} size="sm" />
            <b>{p.name}</b>
          </span>
          <span>{p.wins}</span>
          <span>{p.losses}</span>
          <span className="earn">{p.puzzles}</span>
        </div>
      ))}
    </div>
  );
}
