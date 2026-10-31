"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { sfx } from "@/lib/sound";
import type { MatchState } from "../GameApp";
import Avatar from "../Avatar";

const KEYS = ["A", "B", "C", "D"];
const isMath = (t: string) => /^[\d\s+−×÷=?]+$/.test(t);

export default function Match({ state, onAnswer }: { state: MatchState; onAnswer: (i: number) => void }) {
  const { found, question: q, reveal, myChoice, oppAnswered, results, scores } = state;
  const [left, setLeft] = useState(q?.seconds ?? found.seconds);

  // Local countdown display; the server is the real clock.
  useEffect(() => {
    if (!q) return;
    const startedAt = Date.now();
    setLeft(q.seconds);
    const t = setInterval(() => {
      const remaining = Math.max(0, Math.ceil(q.seconds - (Date.now() - startedAt) / 1000));
      setLeft(remaining);
      if (remaining <= 3 && remaining > 0) sfx.tick();
      if (remaining === 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [q]);

  const low = left <= 3 && !reveal;
  const myPoints = reveal?.you.points ?? 0;

  return (
    <section className="screen">
      <div className="scorebar">
        <div className="pscore you">
          <Avatar name={found.you.name} avatar={found.you.avatar} size="sm" />
          <div>
            <small>Aap</small>
            <b>{scores.you}</b>
          </div>
        </div>

        <div className={`timer ${low ? "low" : ""}`}>
          <svg viewBox="0 0 44 44">
            <circle className="track" cx="22" cy="22" r="19" />
            <circle
              key={q?.index ?? -1}
              className={`bar ${q ? "run" : ""} ${reveal || myChoice !== null ? "paused" : ""}`}
              cx="22" cy="22" r="19"
              style={{ animationDuration: `${q?.seconds ?? found.seconds}s` }}
            />
          </svg>
          <span>{reveal ? <Check size={22} strokeWidth={3} /> : left}</span>
        </div>

        <div className="pscore opp">
          <div>
            <small>{found.opponent.name}</small>
            <b>{scores.opp}</b>
          </div>
          <Avatar name={found.opponent.name} avatar={found.opponent.avatar} size="sm">
            {oppAnswered && !reveal && <i className="answered-dot" />}
          </Avatar>
        </div>
      </div>

      <div className="progress-dots">
        {Array.from({ length: found.total }, (_, i) => (
          <i key={i} className={results[i] ?? (q && i === q.index ? "now" : "")} />
        ))}
      </div>

      {!q ? (
        <div className="q-card card glass">
          <h2>Tayyar ho jayein…</h2>
        </div>
      ) : (
        <>
          <div className="q-card card glass" key={q.index}>
            <p className="q-count">
              Sawal {q.index + 1}/{q.total}
            </p>
            <h2 className={isMath(q.text) ? "math" : ""}>{q.text}</h2>
          </div>

          <div className="options" key={`o${q.index}`}>
            {q.options.map((opt, i) => {
              let cls = "option";
              if (reveal) {
                if (i === reveal.answerIndex) cls += " correct";
                else if (i === reveal.you.choice) cls += " wrong";
              } else if (i === myChoice) cls += " picked";
              return (
                <button key={i} className={cls} disabled={myChoice !== null || !!reveal} onClick={() => onAnswer(i)}>
                  <span className="key">{KEYS[i]}</span>
                  <span>{opt}</span>
                  {reveal && reveal.opponent.choice === i && (
                    <span className="opp-pick" title="Muqabil ka jawab">
                      <Avatar name={found.opponent.name} avatar={found.opponent.avatar} size="sm" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p
            className={`points-pop ${reveal ? "show" : ""}`}
            style={{ color: myPoints ? "var(--green)" : "var(--red)" }}
          >
            {reveal ? (myPoints ? `+${myPoints} points` : reveal.you.choice === null ? "Waqt khatam!" : "Ghalat jawab") : myChoice !== null ? <span className="muted">Muqabil ka intezar…</span> : ""}
          </p>
        </>
      )}
    </section>
  );
}
