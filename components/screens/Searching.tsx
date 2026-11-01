"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bot } from "lucide-react";
import type { Category } from "@/lib/types";
import Avatar from "../Avatar";

type Props = {
  info: { category: Category; since: number };
  name: string;
  avatar: string;
  waitSeconds: number; // the server looks for a real opponent this long, then the computer plays
  onLeave: () => void;
};

// Short, calm tips that rotate while the player waits in the lobby.
const TIPS = [
  "Jitna tez sahi jawab, utne zyada points — 2 second ke andar poore 100.",
  "Ghalat jawab par 0 points, is liye andaza lagane se pehle soch lein.",
  "Har sawal ke liye 10 second hain.",
  "Match ke dauran tab ya app band na karein — warna match haar jayenge.",
  "Dono players ko bilkul same sawal milte hain.",
];

// The lobby. Free, so the player can leave it any time before a match starts.
export default function Searching({ info, name, avatar, waitSeconds, onLeave }: Props) {
  const [secs, setSecs] = useState(0);
  // puzzles are played alone: the server starts the board right away, nobody is searched for
  const puzzle = info.category.group === "puzzle";
  const left = Math.max(0, waitSeconds - secs);
  const tip = TIPS[Math.floor(secs / 6) % TIPS.length];

  useEffect(() => {
    const t = setInterval(() => setSecs(Math.floor((Date.now() - info.since) / 1000)), 250);
    return () => clearInterval(t);
  }, [info.since]);

  const radar = (
    <div className="radar">
      <span className="ring" />
      <span className="ring" />
      <span className="ring" />
      <Avatar name={name} avatar={avatar} size="xl" />
    </div>
  );

  if (puzzle)
    return (
      <section className="screen center-col searching">
        <p className="eyebrow">{info.category.name} • Free</p>
        {radar}
        <h2>Puzzle tayyar ho raha hai…</h2>
        <p className="muted">1 puzzle — koi muqabil nahi, sirf aap aur ghari.</p>
      </section>
    );

  return (
    <section className="screen center-col searching">
      <p className="eyebrow">{info.category.name} • Free match</p>
      {radar}
      <h2>Muqabil dhoond rahe hain…</h2>

      <div className="wait-card card glass">
        <div className="wait-count">
          <svg viewBox="0 0 44 44">
            <circle className="track" cx="22" cy="22" r="19" />
            <circle className="bar" cx="22" cy="22" r="19" style={{ animationDuration: `${waitSeconds}s` }} />
          </svg>
          <b>{left}</b>
        </div>
        <div>
          <b>{left > 0 ? "Asli player dhoond rahe hain…" : "Computer ke saath match shuru ho raha hai"}</b>
          <p>{left > 0 ? `${left} second mein koi player na mila to computer ke saath khelenge.` : ""}</p>
        </div>
        <Bot className="wait-bot" size={22} />
      </div>

      <p className="lobby-tip" key={tip}>{tip}</p>

      <button className="btn btn-ghost lobby-leave" onClick={onLeave}>
        <ArrowLeft size={16} /> Wapas
      </button>
    </section>
  );
}
