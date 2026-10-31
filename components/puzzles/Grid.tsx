"use client";

import { Eraser } from "lucide-react";

export type CellView = { cls?: string; style?: React.CSSProperties; body?: React.ReactNode };

// A square grid of cells. Interactive cells are buttons; a picture-only grid uses plain divs, so it can sit
// inside a button. Every cell carries data-cell so the walkthrough hand can find it.
export function Grid({ n, cls, cell, onTap, children }: { n: number; cls: string; cell: (i: number) => CellView; onTap?: (i: number) => void; children?: React.ReactNode }) {
  const Cell = onTap ? "button" : "div";
  return (
    <div className={`pz-grid ${cls}`} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      {Array.from({ length: n * n }, (_, i) => {
        const v = cell(i);
        return (
          <Cell key={i} data-cell={i} className={`pz-cell ${v.cls ?? ""}`} style={v.style} onClick={() => onTap?.(i)}>
            {v.body}
          </Cell>
        );
      })}
      {children}
    </div>
  );
}

// Clue numbers around a grid: `top`/`bottom` per column, `left`/`right` per row. Each clue is text or null.
// bad / done: keys like "top3" for a clue that is broken / already met.
type Side = (React.ReactNode | null)[];
type CluedProps = { n: number; top?: Side; left?: Side; right?: Side; bottom?: Side; bad?: Set<string>; done?: Set<string>; children: React.ReactNode };
export function Clued({ n, top, left, right, bottom, bad, done, children }: CluedProps) {
  const strip = (side: string, list: Side | undefined, dir: "row" | "col") =>
    list && (
      <div className={`pz-clues ${side}`} style={dir === "row" ? { gridTemplateColumns: `repeat(${n}, 1fr)` } : { gridTemplateRows: `repeat(${n}, 1fr)` }}>
        {list.map((c, k) => (
          <span key={k} className={bad?.has(`${side}${k}`) ? "bad" : done?.has(`${side}${k}`) ? "done" : ""}>{c}</span>
        ))}
      </div>
    );
  return (
    <div className="pz-clued" style={{ gridTemplateColumns: `${left ? "auto " : ""}minmax(0, 1fr)${right ? " auto" : ""}` }}>
      {top && <>{left && <i />}{strip("top", top, "row")}{right && <i />}</>}
      {strip("left", left, "col")}
      {children}
      {strip("right", right, "col")}
      {bottom && <>{left && <i />}{strip("bottom", bottom, "row")}{right && <i />}</>}
    </div>
  );
}

// Number buttons under a number grid.
export function NumPad({ n, onPick }: { n: number; onPick?: (d: number) => void }) {
  return (
    <div className="pz-pad">
      {Array.from({ length: n }, (_, k) => (
        <button key={k} data-cell={`num-${k + 1}`} disabled={!onPick} onClick={() => onPick?.(k + 1)}>
          {k + 1}
        </button>
      ))}
      <button data-cell="num-0" disabled={!onPick} onClick={() => onPick?.(0)} aria-label="Mitayein">
        <Eraser size={18} />
      </button>
    </div>
  );
}
