"use client";

import { useEffect, useState } from "react";
import { rs } from "@/lib/api";
import { sfx } from "@/lib/sound";
import type { MatchFound } from "@/lib/types";
import Avatar from "../Avatar";

export default function Versus({ found }: { found: MatchFound }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.max(1, x - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => sfx.tick(), [n]);

  return (
    <section className="screen">
      <div className="versus">
        <div className="vs-player left">
          <Avatar name={found.you.name} avatar={found.you.avatar} size="xl" />
          <b>{found.you.name}</b>
        </div>
        <div className="vs-badge">VS</div>
        <div className="vs-player right">
          <Avatar name={found.opponent.name} avatar={found.opponent.avatar} size="xl" />
          <b>{found.opponent.name}</b>
        </div>
      </div>
      <div className="vs-info">
        <p className="eyebrow">{found.category}</p>
        <div className="vs-prize">{found.mode === "practice" ? "Practice match — free" : `Inaam: ${rs(found.prize)}`}</div>
        <div className="countdown" key={n}>
          {n}
        </div>
      </div>
    </section>
  );
}
