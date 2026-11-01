"use client";

import { useEffect, useState } from "react";
import { Check, LogOut, TriangleAlert } from "lucide-react";
import { rs } from "@/lib/api";
import { sfx } from "@/lib/sound";
import type { MatchState } from "../GameApp";
import Avatar from "../Avatar";
import Sheet from "../Sheet";
import CanvasText from "../CanvasText";
import PuzzleRound from "../puzzles/PuzzleRound";

const KEYS = ["A", "B", "C", "D"];
const isMath = (t: string) => /^[\d\s+−×÷=?]+$/.test(t);

type Props = { state: MatchState; onAnswer: (i: number) => void; onSolve: (solution: number[]) => Promise<boolean>; onQuit: () => void };

export default function Match({ state, onAnswer, onSolve, onQuit }: Props) {
  const { found, question: q, reveal, myChoice, oppAnswered, results, scores } = state;
  const [left, setLeft] = useState(q?.seconds ?? found.seconds);
  // matches the 1024px breakpoint in globals.css
  const [wide, setWide] = useState(false);
  useEffect(() => setWide(window.matchMedia("(min-width: 1024px)").matches), []);

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

  // Quit asks first and says exactly what the player loses (a native confirm() would blur the window and count as
  // cheating, so it is an in-app sheet)
  const [quitting, setQuitting] = useState(false);
  const loses =
    found.mode === "practice"
      ? "Practice match khatam ho jayega. Koi paisa nahi katega."
      : found.solo
        ? `Aap ki ${rs(found.entry)} entry wapas nahi milegi aur ye match haar jayenge.`
        : `Aap ki ${rs(found.entry)} entry wapas nahi milegi, aap haar jayenge aur ${rs(found.prize)} ka inaam muqabil ko mil jayega.`;

  const low = left <= 3 && !reveal;
  const myPoints = reveal?.you.points ?? 0;


  return (
    <section className="screen no-select">
      <div className="match-top">
        <button className="quit-btn" onClick={() => setQuitting(true)}>
          <LogOut size={15} /> Chhor dein
        </button>
      </div>
      <Sheet onClose={() => setQuitting(false)}>
        {quitting && (
          <div className="quit-box" role="alertdialog" aria-label="Match chhorna hai?">
            <TriangleAlert size={40} />
            <h3>Match chhorna hai?</h3>
            <p>{loses}</p>
            <small>Ghari chalti rahegi.</small>
            <button className="btn btn-gold btn-block" onClick={() => setQuitting(false)}>
              Nahi, khelte rahein
            </button>
            <button
              className="btn btn-ghost btn-block quit-yes"
              onClick={() => {
                setQuitting(false);
                onQuit();
              }}
            >
              Haan, chhor dein
            </button>
          </div>
        )}
      </Sheet>
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

        {found.solo ? (
          // a puzzle played alone: the prize in place of an opponent
          <div className="pscore opp">
            <div>
              <small>{found.mode === "practice" ? "Practice" : "Inaam"}</small>
              <b>{found.mode === "practice" ? "Free" : rs(found.prize)}</b>
            </div>
          </div>
        ) : (
          <div className="pscore opp">
            <div>
              <small>{found.opponent.name}</small>
              <b>{scores.opp}</b>
            </div>
            <Avatar name={found.opponent.name} avatar={found.opponent.avatar} size="sm">
              {oppAnswered && !reveal && <i className="answered-dot" />}
            </Avatar>
          </div>
        )}
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
      ) : q.puzzle ? (
        <>
          <p className="q-count pz-count">
            {found.solo ? `Puzzle Challenge • ${q.seconds} second` : `Puzzle ${q.index + 1}/${q.total}`}
            {oppAnswered && !reveal && <span className="opp-done"> • Muqabil ne hal kar liya!</span>}
          </p>
          <PuzzleRound key={q.index} puzzle={q.puzzle} solved={myChoice !== null} solution={reveal?.solution} onSolve={onSolve} />
          <p className={`points-pop ${reveal ? "show" : ""}`} style={{ color: myPoints ? "var(--green)" : "var(--red)" }}>
            {found.solo
              ? reveal ? (myPoints ? "Hal ho gaya!" : "Waqt khatam") : ""
              : reveal ? (myPoints ? `+${myPoints} points` : "Is puzzle par 0 points") : myChoice !== null ? <span className="muted">Muqabil ka intezar…</span> : ""}
          </p>
        </>
      ) : (
        <>
          <div className="q-card card glass" key={q.index}>
            <p className="q-count">
              Sawal {q.index + 1}/{q.total}
            </p>
            {/* drawn on a canvas so it can't be copied or read by page tools */}
            <div className="q-text">
              {isMath(q.text) ? (
                <CanvasText text={q.text} size={40} weight={800} align="center" />
              ) : (
                <CanvasText text={q.text} size={wide ? 26 : 21} align="center" />
              )}
            </div>
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
                  <span className="opt-text">
                    <CanvasText text={opt} size={16} weight={600} />
                  </span>
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
