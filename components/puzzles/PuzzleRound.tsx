"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { checkPuzzle } from "@/lib/puzzle-rules";
import type { Puzzle } from "@/lib/types";
import { PUZZLES } from "./registry";

type Props = {
  puzzle: Puzzle;
  solved: boolean; // the server accepted this player's solution
  solution?: number[]; // shown after the round
  onSolve: (solution: number[]) => Promise<boolean>;
};

// One puzzle board in a match. The board is checked in the browser with the same rules the server uses, and sent
// as soon as it is right; the server's answer is what counts.
export default function PuzzleRound({ puzzle, solved, solution, onSolve }: Props) {
  const def = PUZZLES[puzzle.kind];
  const [state, setState] = useState(() => def.init(puzzle));
  const [history, setHistory] = useState<unknown[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const done = solved || !!solution;

  const attempt = def.attempt(puzzle, state);
  const key = attempt ? attempt.join(",") : "";

  useEffect(() => {
    if (!attempt || done || sending) return;
    if (!checkPuzzle(puzzle, attempt)) {
      setMsg("Abhi sahi nahi — laal khane aur qawaid dobara dekhein");
      return;
    }
    setSending(true);
    onSolve(attempt).then((ok) => {
      setSending(false);
      if (!ok) setMsg("Server ne qubool nahi kiya — dobara koshish karein");
    });
  }, [key]);

  const set = (next: unknown) => {
    if (done) return;
    setMsg(null);
    setHistory((h) => [...h.slice(-300), state]);
    setState(next);
  };
  const undo = () => {
    if (!history.length) return;
    setMsg(null);
    setState(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  };
  const reset = () => {
    setMsg(null);
    setHistory((h) => [...h, state]);
    setState(def.init(puzzle));
  };

  // after the round, the board shows the solution
  const view = solution && !solved ? def.shown(puzzle, solution) : state;
  const Board = def.Board;

  return (
    <div className={`pz pz-${puzzle.kind} ${solved ? "pz-solved" : ""}`}>
      <p className="pz-help">{def.goal}</p>
      <div className="pz-board">
        <Board puzzle={puzzle} state={view} set={done ? undefined : set} />
      </div>
      <div className="pz-foot">
        <span className={`pz-msg ${msg ? "bad" : solved ? "good" : ""}`}>
          {solved ? "Hal ho gaya!" : msg ?? (solution ? "Waqt khatam — ye tha sahi hal" : sending ? "Check ho raha hai…" : "")}
        </span>
        {!done && (
          <span className="pz-tools">
            <button className="btn btn-ghost btn-sm" onClick={undo} disabled={!history.length}>
              <Undo2 size={15} /> Wapas
            </button>
            <button className="btn btn-ghost btn-sm" onClick={reset}>
              <RotateCcw size={15} /> Dobara
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
