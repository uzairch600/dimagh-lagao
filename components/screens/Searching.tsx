"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Users } from "lucide-react";
import { rs } from "@/lib/api";
import type { Category } from "@/lib/types";
import Avatar from "../Avatar";

type Props = {
  info: { category: Category; entry: number; prize: number; since: number };
  name: string;
  avatar: string;
  houseMaxEntry: number;
  houseWaitSeconds: number;
  onCancel: () => void;
  onPlayComputer: () => void;
};

export default function Searching({ info, name, avatar, houseMaxEntry, houseWaitSeconds, onCancel, onPlayComputer }: Props) {
  const [secs, setSecs] = useState(0);
  const started = useRef(false);
  const computerAllowed = info.entry <= houseMaxEntry;
  const left = Math.max(0, houseWaitSeconds - secs);

  useEffect(() => {
    const t = setInterval(() => setSecs(Math.floor((Date.now() - info.since) / 1000)), 250);
    return () => clearInterval(t);
  }, [info.since]);

  // After the wait, the app plays the user itself (only for entries it covers).
  useEffect(() => {
    if (computerAllowed && left === 0 && !started.current) {
      started.current = true;
      onPlayComputer();
    }
  }, [computerAllowed, left, onPlayComputer]);

  return (
    <section className="screen center-col searching">
      <p className="eyebrow">
        {info.category.name} • Entry {rs(info.entry)}
      </p>
      <div className="radar">
        <span className="ring" />
        <span className="ring" />
        <span className="ring" />
        <Avatar name={name} avatar={avatar} size="xl" />
      </div>
      <h2>Muqabil dhoond rahe hain…</h2>
      <p className="muted">
        Jeetne wale ko <b className="gold">{rs(info.prize)}</b>
      </p>

      {computerAllowed ? (
        <div className="wait-card card glass">
          <div className="wait-count">
            <svg viewBox="0 0 44 44">
              <circle className="track" cx="22" cy="22" r="19" />
              <circle className="bar" cx="22" cy="22" r="19" style={{ animationDuration: `${houseWaitSeconds}s` }} />
            </svg>
            <b>{left}</b>
          </div>
          <div>
            <b>{left > 0 ? `${left} second mein player na mila…` : "Computer se match shuru ho raha hai…"}</b>
            <p>
              …to <b>app khud aap ke saath match khelegi</b> aur aap ke muqable mein {rs(info.entry)} lagayegi. Muqabil
              &quot;Computer&quot; likha hoga.
            </p>
          </div>
          <Bot className="wait-bot" size={22} />
        </div>
      ) : (
        <div className="wait-card card glass">
          <Users size={26} className="wait-users" />
          <div>
            <b>Sirf asli players</b>
            <p>{rs(info.entry)} ki entry par computer nahi khelta. Thora intezar karein ya chhoti entry chunein.</p>
          </div>
        </div>
      )}

      <button className="btn btn-ghost" onClick={onCancel}>
        Cancel
      </button>
      <p className="fine">Entry fee sirf tab kategi jab match shuru ho.</p>
    </section>
  );
}
