"use client";

import { useEffect, useState } from "react";
import { rs } from "@/lib/api";
import { sfx } from "@/lib/sound";
import type { MatchFound } from "@/lib/types";
import Avatar from "../Avatar";

const PREP_STEPS = ["Muqabla set ho raha hai", "AI naye sawal likh raha hai", "Har jawab fact-check ho raha hai", "Bas tayyar…"];

export default function Versus({ found }: { found: MatchFound }) {
  const preparing = !!found.preparing;
  const [n, setN] = useState(3);
  const [step, setStep] = useState(0);
  const [secs, setSecs] = useState(0);

  // Countdown runs only once the questions are ready.
  useEffect(() => {
    if (preparing) return;
    const t = setInterval(() => setN((x) => Math.max(1, x - 1)), 1000);
    return () => clearInterval(t);
  }, [preparing]);
  useEffect(() => {
    if (!preparing) sfx.tick();
  }, [n, preparing]);

  // While the AI writes this match's questions.
  useEffect(() => {
    if (!preparing) return;
    const t = setInterval(() => {
      setSecs((s) => s + 1);
      setStep((s) => Math.min(PREP_STEPS.length - 1, s + (Math.random() < 0.25 ? 1 : 0)));
    }, 1000);
    return () => clearInterval(t);
  }, [preparing]);

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
        {preparing ? (
          <div className="prep">
            <div className="prep-spinner" />
            <b>{PREP_STEPS[step]}</b>
            <small>
              Is match ke liye bilkul naye sawal ban rahe hain • {secs}s
            </small>
          </div>
        ) : (
          <div className="countdown" key={n}>
            {n}
          </div>
        )}
      </div>
    </section>
  );
}
