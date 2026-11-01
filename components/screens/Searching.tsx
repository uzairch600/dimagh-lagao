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
  challengeMaxEntry: number;
  refundSeconds: number;
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
export default function Searching({ info, name, avatar, houseWaitSeconds, challengeMaxEntry, refundSeconds, onStartChallenge }: Props) {
  const [secs, setSecs] = useState(0);
  const started = useRef(false);
  const practice = !!info.practice;
  // puzzles are played alone: the server starts the board right away, nobody is searched for
  const puzzle = info.category.group === "puzzle";
  // above challengeMaxEntry there is no Puzzle Challenge: wait for a real opponent, refund after refundSeconds
  const challenge = !practice && !puzzle && info.entry <= challengeMaxEntry;
  // free quiz: the server looks for another free player for houseWaitSeconds, then the computer plays
  const wait = challenge || practice ? houseWaitSeconds : refundSeconds;
  const left = Math.max(0, wait - secs);
  const tip = TIPS[Math.floor(secs / 6) % TIPS.length];

  useEffect(() => {
    const t = setInterval(() => setSecs(Math.floor((Date.now() - info.since) / 1000)), 250);
    return () => clearInterval(t);
  }, [info.since]);

  // After the wait, a solo Puzzle Challenge starts instead (any entry).
  useEffect(() => {
    if (challenge && left === 0 && !started.current) {
      started.current = true;
      onStartChallenge();
    }
  }, [challenge, left, onStartChallenge]);

  if (puzzle)
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
        <h2>Puzzle tayyar ho raha hai…</h2>
        <p className="muted">1 puzzle — koi muqabil nahi, sirf aap aur ghari.</p>
      </section>
    );

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
      <h2>{practice ? "Free muqabil dhoond rahe hain…" : "Muqabil dhoond rahe hain…"}</h2>
      {!practice && (
        <p className="muted">
          Jeetne wale ko <b className="gold">{rs(info.prize)}</b>
        </p>
      )}

      {practice && (
        <div className="wait-card card glass">
          <div className="wait-count">
            <svg viewBox="0 0 44 44">
              <circle className="track" cx="22" cy="22" r="19" />
              <circle className="bar" cx="22" cy="22" r="19" style={{ animationDuration: `${wait}s` }} />
            </svg>
            <b>{left}</b>
          </div>
          <div>
            <b>{left > 0 ? "Asli player dhoond rahe hain…" : "Computer ke saath match shuru ho raha hai"}</b>
            <p>
              Free match — koi paisa nahi. {left > 0 ? `${left} second mein koi player na mila to computer ke saath khelenge.` : ""}
            </p>
          </div>
          <Puzzle className="wait-bot" size={22} />
        </div>
      )}

      {!practice && (
        <div className="wait-card card glass">
          <div className="wait-count">
            <svg viewBox="0 0 44 44">
              <circle className="track" cx="22" cy="22" r="19" />
              <circle className="bar" cx="22" cy="22" r="19" style={{ animationDuration: `${wait}s` }} />
            </svg>
            <b>{left}</b>
          </div>
          <div>
            {challenge ? (
              <>
                <b>{left > 0 ? `${left} second mein player na mila…` : "Puzzle Challenge shuru ho raha hai"}</b>
                <p>
                  …to aap ko <b>Puzzle Challenge</b> milega: ek puzzle, 35–90 second (puzzle ke hisaab se). Waqt par hal kiya to{" "}
                  <b>{rs(info.prize)}</b>, warna entry gayi.
                </p>
              </>
            ) : (
              <>
                <b>Sirf asli muqabil</b>
                <p>
                  {rs(info.entry)} ki entry par sirf asli player se match hota hai. {Math.ceil(left / 60)} minute mein koi na mila
                  to <b>entry wapas</b> mil jayegi.
                </p>
              </>
            )}
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
