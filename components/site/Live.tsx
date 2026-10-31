"use client";

// Live data widgets for the public website. Everything shown here comes from real matches.
import { useEffect, useState } from "react";
import { Activity, Swords, Trophy, Users } from "lucide-react";
import { api, rs } from "@/lib/api";
import type { LeaderRow } from "@/lib/types";
import Avatar from "../Avatar";

type Live = {
  online: number;
  playing: number;
  searching: number;
  paidToday: number;
  recent: { id: string; winner: string; avatar?: string; loser: string; prize: number; category: string; at: number }[];
};

const CATEGORY: Record<string, string> = {
  pakistan: "Pakistan GK", cricket: "Cricket", world: "Duniya GK", science: "Science", math: "Math Speed",
};

const ago = (t: number) => {
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s pehle`;
  if (s < 3600) return `${Math.floor(s / 60)} min pehle`;
  if (s < 86400) return `${Math.floor(s / 3600)} ghante pehle`;
  return `${Math.floor(s / 86400)} din pehle`;
};

function useLive(intervalMs = 10000) {
  const [live, setLive] = useState<Live | null>(null);
  useEffect(() => {
    const load = () => api<Live>("/api/live").then(setLive).catch(() => {});
    load();
    const t = setInterval(load, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return live;
}

export function LiveStrip() {
  const live = useLive();
  const items = [
    { icon: Users, value: live ? String(live.online) : "—", label: "Abhi online" },
    { icon: Swords, value: live ? String(live.playing) : "—", label: "Match khel rahe hain" },
    { icon: Activity, value: live ? rs(live.paidToday) : "—", label: "Aaj ke inaam" },
  ];
  return (
    <div className="live-strip">
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
  if (!live) return <div className="site-empty">Load ho raha hai…</div>;
  if (!live.recent.length)
    return (
      <div className="site-empty">
        <Trophy size={32} />
        <p>Abhi tak koi winner nahi — pehla inaam aap ka ho sakta hai!</p>
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
              {CATEGORY[r.category] ?? r.category} • {r.loser} ko haraya • {ago(r.at)}
            </small>
          </div>
          <span className="won">+{rs(r.prize)}</span>
        </div>
      ))}
    </div>
  );
}

export function LeaderboardTable() {
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  useEffect(() => {
    api<{ players: LeaderRow[] }>("/api/leaderboard")
      .then((d) => setRows(d.players))
      .catch(() => setRows([]));
  }, []);
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
        <span>Kamai</span>
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
          <span className="earn">{rs(p.earnings)}</span>
        </div>
      ))}
    </div>
  );
}
