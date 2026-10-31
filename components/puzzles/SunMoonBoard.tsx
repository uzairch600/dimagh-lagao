"use client";

import { Moon, Sun } from "lucide-react";

type Props = {
  n: number;
  givens: number[]; // -1 empty, 0 sun, 1 moon
  hints: [number, number, boolean][];
  values: number[]; // the player's grid, same encoding
  onTap?: (i: number) => void;
};

// Cells that break a rule: more than half of one kind in a line, three alike in a row, or a broken = / x.
export function sunmoonConflicts(n: number, hints: [number, number, boolean][], v: number[]) {
  const bad = new Set<number>();
  const lines: number[][] = [];
  for (let k = 0; k < n; k++) {
    lines.push(Array.from({ length: n }, (_, j) => k * n + j));
    lines.push(Array.from({ length: n }, (_, j) => j * n + k));
  }
  for (const line of lines) {
    for (const kind of [0, 1]) if (line.filter((i) => v[i] === kind).length > n / 2) line.forEach((i) => v[i] === kind && bad.add(i));
    for (let j = 0; j + 2 < n; j++) {
      const [a, b, c] = [line[j], line[j + 1], line[j + 2]];
      if (v[a] !== -1 && v[a] === v[b] && v[a] === v[c]) [a, b, c].forEach((i) => bad.add(i));
    }
  }
  for (const [a, b, same] of hints) if (v[a] !== -1 && v[b] !== -1 && (v[a] === v[b]) !== same) [a, b].forEach((i) => bad.add(i));
  return bad;
}

export default function SunMoonBoard({ n, givens, hints, values, onTap }: Props) {
  const bad = sunmoonConflicts(n, hints, values);
  // a picture-only board (no onTap) uses plain divs, so it can sit inside a button
  const Cell = onTap ? "button" : "div";
  return (
    <div className="pz-grid sunmoon" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      {values.map((v, i) => {
        const fixed = givens[i] !== -1;
        const right = hints.find(([a, b]) => a === i && b === i + 1);
        const down = hints.find(([a, b]) => a === i && b === i + n);
        return (
          <Cell key={i} className={`pz-cell ${fixed ? "fixed" : ""} ${bad.has(i) ? "clash" : ""}`} onClick={() => !fixed && onTap?.(i)}>
            {v === 0 && <Sun size={24} strokeWidth={2.4} className="pz-sun" />}
            {v === 1 && <Moon size={22} strokeWidth={2.4} className="pz-moon" />}
            {right && <span className="pz-hint h">{right[2] ? "=" : "×"}</span>}
            {down && <span className="pz-hint v">{down[2] ? "=" : "×"}</span>}
          </Cell>
        );
      })}
    </div>
  );
}
