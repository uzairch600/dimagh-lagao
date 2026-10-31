"use client";

import { useEffect, useState } from "react";
import { api, rs } from "@/lib/api";
import { Crown } from "lucide-react";
import type { LeaderRow, User } from "@/lib/types";
import Avatar from "../Avatar";

export default function Leaderboard({ me }: { me: User }) {
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  useEffect(() => {
    api<{ players: LeaderRow[] }>("/api/leaderboard")
      .then((d) => setRows(d.players))
      .catch(() => setRows([]));
  }, []);

  const top = rows?.slice(0, 3) ?? [];
  const podiumOrder = [top[1], top[0], top[2]];

  return (
    <section className="screen">
      <h2 className="page-title">Leaderboard</h2>
      {rows === null && <div className="empty">Load ho raha hai…</div>}
      {rows?.length === 0 && <div className="empty">Abhi koi paid match nahi hua. Pehle number par aap aa jayein!</div>}

      {top.length > 0 && (
        <div className="podium">
          {podiumOrder.map((p, i) =>
            p ? (
              <div key={p.id} className={`pod p${[2, 1, 3][i]}`}>
                {i === 1 && <Crown className="crown" size={22} />}
                <Avatar name={p.name} avatar={p.avatar} />
                <b>{p.name}</b>
                <small>{rs(p.earnings)}</small>
                <div className="base">{[2, 1, 3][i]}</div>
              </div>
            ) : (
              <div key={i} />
            ),
          )}
        </div>
      )}

      {rows?.slice(3).map((p, i) => (
        <div key={p.id} className={`lb-row ${p.id === me.id ? "me" : ""}`}>
          <span className="rank">{i + 4}</span>
          <Avatar name={p.name} avatar={p.avatar} size="sm" />
          <span className="info">
            <b>{p.name}</b>
            <small>
              {p.wins} jeet • {p.losses} haar
            </small>
          </span>
          <span className="earn">{rs(p.earnings)}</span>
        </div>
      ))}
    </section>
  );
}
