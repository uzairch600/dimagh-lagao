"use client";

import { useState } from "react";
import { ArrowRight, CirclePlay, Timer, Zap } from "lucide-react";
import type { Category, PuzzleKind } from "@/lib/types";
import Sheet from "../Sheet";
import PuzzleDemo from "../puzzles/PuzzleDemo";
import { PUZZLES, isPuzzleKind, samplesFor } from "../puzzles/registry";

// A small solved board as a card picture (a solved flood is one flat colour and a solved target one number, so those
// two show their starting board).
const START_ART = new Set<PuzzleKind>(["flood", "target"]);
function Art({ kind }: { kind: PuzzleKind }) {
  const def = PUZZLES[kind];
  const { puzzle, solution } = samplesFor(kind)[0];
  const Board = def.Board;
  return <Board puzzle={puzzle} state={START_ART.has(kind) ? def.init(puzzle) : def.shown(puzzle, solution)} />;
}

// The Puzzles half of Khelein: banner, then one card per puzzle with a "Kaise khelein" button.
export default function PuzzleSection({ puzzles, onPick }: { puzzles: Category[]; onPick: (c: Category) => void }) {
  const [demo, setDemo] = useState<Category | null>(null);
  const list = puzzles.filter((c) => isPuzzleKind(c.id));

  return (
    <>
      <div className="pz-banner card">
        <div className="pz-banner-copy">
          <span className="tag">{list.length} PUZZLES · SOLO CHALLENGE</span>
          <h2>
            <Timer size={26} /> Dimagh ki Race
          </h2>
          <p>
            Aap aur ghari, koi muqabil nahi. <b>100 second mein puzzle hal karein, inaam jeetein.</b> {list.length} qisam ke puzzle.
          </p>
          <div className="pz-banner-chips">
            <span className="pz-banner-chip">
              <CirclePlay size={14} /> Har puzzle ka live demo
            </span>
            <span className="pz-banner-chip">
              <Zap size={14} /> Free practice bhi
            </span>
          </div>
        </div>
        <div className="pz-banner-art" aria-hidden="true">
          <span className="pz-art pz-crowns"><Art kind="crowns" /></span>
          <span className="pz-art pz-pipes"><Art kind="pipes" /></span>
        </div>
      </div>

      <div className="cat-grid2 pz-cards">
        {list.map((c) => {
          const kind = c.id as PuzzleKind;
          return (
            // a div, not a button: the card picture is a real board, which can hold buttons of its own
            <div
              key={c.id}
              className="cat2 pz-card"
              role="button"
              tabIndex={0}
              onClick={() => onPick(c)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick(c))}
            >
              <span className={`cat2-art pz-art pz-${kind}`} aria-hidden="true">
                <Art kind={kind} />
              </span>
              <span className="cat2-body">
                <b>{c.name}</b>
                <small>{PUZZLES[kind].blurb}</small>
              </span>
              <span className="pz-card-foot">
                <button
                  className="pz-demo-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDemo(c);
                  }}
                >
                  <CirclePlay size={14} /> Kaise khelein
                </button>
                <span className="cat2-go">
                  Khelein <ArrowRight size={14} />
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <Sheet wide onClose={() => setDemo(null)}>
        {demo && (
          <PuzzleDemo
            kind={demo.id as PuzzleKind}
            name={demo.name}
            onPlay={() => {
              setDemo(null);
              onPick(demo);
            }}
          />
        )}
      </Sheet>
    </>
  );
}
