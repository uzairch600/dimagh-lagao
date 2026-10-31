"use client";

import { useEffect, useState } from "react";
import { Activity, Swords, Users } from "lucide-react";
import { api, rs } from "@/lib/api";
import type { Config } from "@/lib/types";
import Avatar from "./Avatar";

type Live = {
  online: number;
  playing: number;
  searching: number;
  paidToday: number;
  recent: { id: string; winner: string; avatar?: string; loser: string; prize: number; category: string; at: number }[];
};

const ago = (t: number) => {
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s pehle`;
  if (s < 3600) return `${Math.floor(s / 60)} min pehle`;
  return `${Math.floor(s / 3600)} ghante pehle`;
};

export default function LiveFeed({ config }: { config: Config }) {
  const [live, setLive] = useState<Live | null>(null);

  useEffect(() => {
    const load = () => api<Live>("/api/live").then(setLive).catch(() => {});
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  if (!live) return null;
  const catName = (id: string) => config.categories.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="live">
      <div className="section-head">
        <h3>
          <span className="live-dot" /> Live abhi
        </h3>
      </div>
      <div className="live-stats">
        <div>
          <Users size={18} />
          <b>{live.online}</b>
          <small>Online</small>
        </div>
        <div>
          <Swords size={18} />
          <b>{live.playing}</b>
          <small>Khel rahe hain</small>
        </div>
        <div className="gold-stat">
          <Activity size={18} />
          <b>{rs(live.paidToday)}</b>
          <small>Aaj ke inaam</small>
        </div>
      </div>

      {live.recent.length > 0 && (
        <div className="feed card glass">
          {live.recent.slice(0, 6).map((r) => (
            <div className="feed-row" key={r.id}>
              <Avatar name={r.winner} avatar={r.avatar} size="sm" />
              <span className="info">
                <b>{r.winner}</b>
                <small>
                  {catName(r.category)} mein {r.loser} ko haraya • {ago(r.at)}
                </small>
              </span>
              <span className="won">+{rs(r.prize)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
