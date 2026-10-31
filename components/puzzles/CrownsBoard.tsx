"use client";

import { Crown, X } from "lucide-react";

const COLORS = ["#b9a5ff", "#ffcf7a", "#8fe3c0", "#ff9fb6", "#8fd0ff", "#f5a97f", "#c8e67a", "#e0b8ff"];

type Props = {
  n: number;
  regions: number[];
  marks: number[]; // 0 empty, 1 cross, 2 crown
  onTap?: (i: number) => void;
};

// Cells holding a crown that breaks a rule (same row, column or colour, or touching another crown).
export function crownConflicts(n: number, regions: number[], marks: number[]) {
  const crowns = marks.map((m, i) => (m === 2 ? i : -1)).filter((i) => i >= 0);
  const bad = new Set<number>();
  for (const a of crowns) for (const b of crowns) {
    if (a >= b) continue;
    const ra = Math.floor(a / n), ca = a % n, rb = Math.floor(b / n), cb = b % n;
    if (ra === rb || ca === cb || regions[a] === regions[b] || (Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1)) {
      bad.add(a);
      bad.add(b);
    }
  }
  return bad;
}

export default function CrownsBoard({ n, regions, marks, onTap }: Props) {
  const bad = crownConflicts(n, regions, marks);
  // a picture-only board (no onTap) uses plain divs, so it can sit inside a button
  const Cell = onTap ? "button" : "div";
  const edge = (i: number, j: number | null) => (j === null || regions[j] !== regions[i] ? " thick" : "");
  return (
    <div className="pz-grid crowns" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      {regions.map((reg, i) => {
        const r = Math.floor(i / n), c = i % n;
        const cls =
          "pz-cell" +
          (edge(i, r > 0 ? i - n : null) ? " bt" : "") +
          (edge(i, c > 0 ? i - 1 : null) ? " bl" : "") +
          (edge(i, c < n - 1 ? i + 1 : null) ? " br" : "") +
          (edge(i, r < n - 1 ? i + n : null) ? " bb" : "") +
          (bad.has(i) ? " clash" : "");
        return (
          <Cell key={i} data-cell={i} className={cls} style={{ background: COLORS[reg % COLORS.length] }} onClick={() => onTap?.(i)}>
            {marks[i] === 1 && <X size={14} strokeWidth={3} className="pz-x" />}
            {marks[i] === 2 && <Crown size={22} strokeWidth={2.4} className="pz-crown" />}
          </Cell>
        );
      })}
    </div>
  );
}
