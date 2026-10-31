"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, Puzzle } from "lucide-react";
import { rs } from "@/lib/api";
import type { Category } from "@/lib/types";
import Avatar from "../Avatar";

type Props = {
  info: { category: Category; entry: number; prize: number; since: number; practice?: boolean };
  name: string;
  avatar: string;
  houseWaitSeconds: number;
  onStartChallenge: () => void;
};

// Short, calm tips that rotate while the player waits in the lobby.
const TIPS = [
  "Jitna tez sahi jawab, utne zyada points — 2 second ke andar poore 100.",
  "Ghalat jawab par 0 points, is liye andaza lagane se pehle soch lein.",
  "Har sawal ke liye 10 second hain.",
  "Match ke dauran tab ya app band na karein — warna match haar jayenge.",
  "Dono players ko bilkul same sawal milte hain.",
];

// The lobby. The entry is already paid and there is no way back from here.
export default function Searching({ info, name, avatar, houseWaitSeconds, onStartChallenge }: Props) {
  const [secs, setSecs] = useState(0);
  const started = useRef(false);
  const practice = !!info.practice;
  const left = Math.max(0, houseWaitSeconds - secs);
  const tip = TIPS[Math.floor(secs / 6) % TIPS.length];

  useEffect(() => {
    const t = setInterval(() => setSecs(Math.floor((Date.now() - info.since) / 1000)), 250);
    return () => clearInterval(t);
  }, [info.since]);

  // After the wait, a solo Puzzle Challenge starts instead (any entry).
  useEffect(() => {
    if (!practice && left === 0 && !started.current) {
      started.current = true;
      onStartChallenge();
    }
  }, [practice, left, onStartChallenge]);

  return (
    <section className="screen center-col searching">
      <p className="eyebrow">
        {info.category.name} • {practice ? "Free practice" : `Entry ${rs(info.entry)}`}
      </p>
      <div className="radar">
        <span className="ring" />
        <span className="ring" />
        <span className="ring" />
        <Avatar name={name} avatar={avatar} size="xl" />
      </div>
      <h2>Muqabil dhoond rahe hain…</h2>
      {!practice && (
        <p className="muted">
          Jeetne wale ko <b className="gold">{rs(info.prize)}</b>
        </p>
      )}

      {!practice && (
        <div className="wait-card card glass">
          <div className="wait-count">
            <svg viewBox="0 0 44 44">
              <circle className="track" cx="22" cy="22" r="19" />
              <circle className="bar" cx="22" cy="22" r="19" style={{ animationDuration: `${houseWaitSeconds}s` }} />
            </svg>
            <b>{left}</b>
          </div>
          <div>
            <b>{left > 0 ? `${left} second mein player na mila…` : "Puzzle Challenge shuru ho raha hai"}</b>
            <p>
              …to aap ko <b>Puzzle Challenge</b> milega: ek puzzle, 100 second. Waqt par hal kiya to{" "}
              <b>{rs(info.prize)}</b>, warna entry gayi.
            </p>
          </div>
          <Puzzle className="wait-bot" size={22} />
        </div>
      )}

      <p className="lobby-tip" key={tip}>{tip}</p>

      {!practice && (
        <p className="fine lobby-lock">
          <Lock size={14} /> Entry {rs(info.entry)} kat chuki hai. Lobby chhorne par entry wapas nahi milegi.
        </p>
      )}
    </section>
  );
}
