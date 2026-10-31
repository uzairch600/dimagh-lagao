"use client";

import { useState } from "react";
import { ArrowRight, CirclePlay, Swords, Zap } from "lucide-react";
import type { Category, PuzzleKind } from "@/lib/types";
import Sheet from "../Sheet";
import PuzzleDemo from "../puzzles/PuzzleDemo";
import { FAMILIES, PUZZLES, isPuzzleKind, samplesFor } from "../puzzles/registry";

// A small solved board as a card picture (a solved flood is one flat colour and a solved target one number, so those
// two show their starting board).
const START_ART = new Set<PuzzleKind>(["flood", "target"]);
function Art({ kind }: { kind: PuzzleKind }) {
  const def = PUZZLES[kind];
  const { puzzle, solution } = samplesFor(kind)[0];
  const Board = def.Board;
  return <Board puzzle={puzzle} state={START_ART.has(kind) ? def.init(puzzle) : def.shown(puzzle, solution)} />;
}

// The Puzzles half of Khelein: banner, family filter, one card per puzzle with a "Demo" button.
export default function PuzzleSection({ puzzles, onPick }: { puzzles: Category[]; onPick: (c: Category) => void }) {
  const [family, setFamily] = useState("all");
  const [demo, setDemo] = useState<Category | null>(null);
  const list = puzzles.filter((c) => isPuzzleKind(c.id));
  const inFamily = (c: Category) => family === "all" || FAMILIES.find((f) => f.id === family)!.kinds.includes(c.id as PuzzleKind);

  return (
    <>
      <div className="pz-banner card">
        <div className="pz-banner-copy">
          <span className="tag">{list.length} PUZZLES · LIVE 1v1</span>
          <h2>
            <Swords size={26} /> Dimagh ki Race
          </h2>
          <p>
            Ek hi puzzle, do dimagh. <b>Jo pehle hal kare, wohi jeete.</b> 1 puzzle, 100 second — {list.length} qisam ke puzzle.
          </p>
          <div className="pz-banner-chips">
            <span className="pz-banner-chip">
              <CirclePlay size={14} /> Har puzzle ka live demo
            </span>
            <span className="pz-banner-chip">
              <Zap size={14} /> Tez hal = zyada points
            </span>
          </div>
        </div>
        <div className="pz-banner-art" aria-hidden="true">
          <span className="pz-art pz-crowns"><Art kind="crowns" /></span>
          <span className="pz-art pz-pipes"><Art kind="pipes" /></span>
        </div>
      </div>

      <div className="pz-filters" role="tablist">
        {[{ id: "all", name: "Sab" }, ...FAMILIES].map((f) => (
          <button key={f.id} role="tab" aria-selected={family === f.id} className={family === f.id ? "on" : ""} onClick={() => setFamily(f.id)}>
            {f.name}
            <small>{f.id === "all" ? list.length : list.filter((c) => FAMILIES.find((x) => x.id === f.id)!.kinds.includes(c.id as PuzzleKind)).length}</small>
          </button>
        ))}
      </div>

      <div className="cat-grid2 pz-cards">
        {list.filter(inFamily).map((c) => {
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
