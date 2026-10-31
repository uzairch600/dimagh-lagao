"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import CanvasText from "./CanvasText";

type Chart = { rows: string[]; cols: string[] };

// A logic puzzle's numbered clues, drawn on canvas like every question.
export function Clues({ clues, wide }: { clues: string[]; wide: boolean }) {
  return (
    <ol className="clues">
      {clues.map((c, i) => (
        <li key={i}>
          <span className="clue-n">{i + 1}</span>
          <span className="clue-text">
            <CanvasText text={c} size={wide ? 16 : 14.5} weight={500} />
          </span>
        </li>
      ))}
    </ol>
  );
}

// The player's own notes for a logic puzzle. Tap a cell: empty -> cross (ruled out) -> tick (sure) -> empty.
export default function NotesChart({ charts }: { charts: Chart[] }) {
  const [marks, setMarks] = useState<Record<string, 0 | 1 | 2>>({});
  const tap = (key: string) => setMarks((m) => ({ ...m, [key]: (((m[key] ?? 0) + 1) % 3) as 0 | 1 | 2 }));

  return (
    <div className="notes card glass">
      <p className="notes-head">
        Notes chart
        <small>
          tap karein: <X size={12} strokeWidth={3} /> nahi • <Check size={12} strokeWidth={3} /> haan
        </small>
      </p>
      <div className="notes-grids">
        {charts.map((chart, ci) => (
          <table key={ci} className="notes-grid">
            <thead>
              <tr>
                <th />
                {chart.cols.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((r) => (
                <tr key={r}>
                  <th>{r}</th>
                  {chart.cols.map((c) => {
                    const key = `${ci}:${r}:${c}`;
                    const v = marks[key] ?? 0;
                    return (
                      <td key={c}>
                        <button className={`cell m${v}`} onClick={() => tap(key)} aria-label={`${r} ${c}`}>
                          {v === 1 && <X size={14} strokeWidth={3} />}
                          {v === 2 && <Check size={14} strokeWidth={3} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
}
