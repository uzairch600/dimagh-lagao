"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { Puzzle } from "@/lib/types";
import CrownsBoard, { crownConflicts } from "./CrownsBoard";
import PathBoard from "./PathBoard";
import SunMoonBoard, { sunmoonConflicts } from "./SunMoonBoard";

export const PUZZLE_HELP: Record<Puzzle["kind"], string> = {
  crowns: "Har row, har column aur har rang mein sirf ek taaj. Do taaj aapas mein na chhoo'ein — kone se bhi nahi. Ek tap = ✕, doosra tap = taaj.",
  sunmoon: "Har row aur column mein aadhe suraj, aadhe chaand. Ek line mein 3 ek jaise nahi. = matlab dono same, × matlab dono alag.",
  path: "1 se shuru karein aur numbers ko tarteeb se jorte hue har khana bharein. Ungli ya mouse se kheenchein.",
  maze: "Rocket se jhande tak raasta kheenchein. Deewaron ke aar paar nahi ja sakte.",
};

type Props = {
  puzzle: Puzzle;
  solved: boolean; // the server accepted this player's solution
  solution?: number[]; // shown after the round
  onSolve: (solution: number[]) => Promise<boolean>;
};

export default function PuzzleRound({ puzzle, solved, solution, onSolve }: Props) {
  const n = puzzle.n;
  const blank = () => (puzzle.kind === "sunmoon" ? [...puzzle.givens] : puzzle.kind === "crowns" ? new Array(n * n).fill(0) : []);
  const [state, setState] = useState<number[]>(blank);
  const [msg, setMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const done = solved || !!solution;

  // what the player has built so far, as a solution the server can check (null = not complete yet)
  const attempt = (() => {
    if (puzzle.kind === "crowns") {
      const crowns = state.map((m, i) => (m === 2 ? i : -1)).filter((i) => i >= 0);
      return crowns.length === n && crownConflicts(n, puzzle.regions, state).size === 0 ? crowns : null;
    }
    if (puzzle.kind === "sunmoon") return state.every((v) => v !== -1) && sunmoonConflicts(n, puzzle.hints, state).size === 0 ? state : null;
    if (puzzle.kind === "path") return state.length === n * n ? state : null;
    return state[state.length - 1] === puzzle.end ? state : null;
  })();
  const key = attempt ? attempt.join(",") : "";

  // sent as soon as the board is complete
  useEffect(() => {
    if (!attempt || done || sending) return;
    setSending(true);
    onSolve(attempt).then((ok) => {
      setSending(false);
      setMsg(ok ? null : puzzle.kind === "path" ? "Numbers tarteeb se nahi jure — dobara koshish karein" : "Abhi sahi nahi — qawaid dobara dekhein");
    });
  }, [key]);

  const tap = (i: number) => {
    if (done) return;
    setMsg(null);
    setState((s) => {
      const next = [...s];
      if (puzzle.kind === "crowns") next[i] = (next[i] + 1) % 3;
      else next[i] = next[i] === -1 ? 0 : next[i] === 0 ? 1 : -1;
      return next;
    });
  };
  const setPath = (p: number[]) => {
    if (done) return;
    setMsg(null);
    setState(p);
  };

  // after the round, the board shows the solution
  let view = state;
  if (solution && !solved) {
    if (puzzle.kind === "crowns") view = Array.from({ length: n * n }, (_, i) => (solution.includes(i) ? 2 : 0));
    else view = solution;
  }

  const live = !done;
  return (
    <div className={`pz ${solved ? "pz-solved" : ""}`}>
      <p className="pz-help">{PUZZLE_HELP[puzzle.kind]}</p>
      <div className="pz-board">
        {puzzle.kind === "crowns" && <CrownsBoard n={n} regions={puzzle.regions} marks={view} onTap={live ? tap : undefined} />}
        {puzzle.kind === "sunmoon" && <SunMoonBoard n={n} givens={puzzle.givens} hints={puzzle.hints} values={view} onTap={live ? tap : undefined} />}
        {puzzle.kind === "path" && <PathBoard n={n} numbers={puzzle.numbers} path={view} setPath={live ? setPath : undefined} />}
        {puzzle.kind === "maze" && (
          <PathBoard n={n} open={puzzle.open} start={puzzle.start} end={puzzle.end} path={view.length ? view : [puzzle.start]} setPath={live ? setPath : undefined} />
        )}
      </div>
      <div className="pz-foot">
        <span className={`pz-msg ${msg ? "bad" : solved ? "good" : ""}`}>
          {solved ? "Hal ho gaya!" : msg ?? (solution ? "Waqt khatam — ye tha sahi hal" : sending ? "Check ho raha hai…" : "")}
        </span>
        {live && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setState(blank()); setMsg(null); }}>
            <RotateCcw size={15} /> Dobara
          </button>
        )}
      </div>
    </div>
  );
}
