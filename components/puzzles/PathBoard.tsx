"use client";

import { useRef } from "react";
import { Flag, Rocket } from "lucide-react";

// Shared by "Number Raasta" (numbers to join in order, every cell once) and the maze (walls block moves).
type Props = {
  n: number;
  path: number[];
  setPath?: (p: number[]) => void;
  numbers?: [number, number][]; // [cell, number]
  open?: number[]; // maze: bit 1 = open to the right, bit 2 = open downwards
  start?: number;
  end?: number;
};

export default function PathBoard({ n, path, setPath, numbers = [], open, start, end }: Props) {
  const dragging = useRef(false);
  const numberAt = new Map(numbers.map(([cell, num]) => [cell, num]));
  const first = numbers.find(([, num]) => num === 1)?.[0] ?? start ?? 0;

  const adjacent = (a: number, b: number) => {
    const ra = Math.floor(a / n), rb = Math.floor(b / n);
    const next = (Math.abs(a - b) === 1 && ra === rb) || Math.abs(a - b) === n;
    if (!next || !open) return next;
    const [lo, hi] = a < b ? [a, b] : [b, a];
    return hi === lo + 1 ? (open[lo] & 1) > 0 : (open[lo] & 2) > 0;
  };

  // one step of the drag: back up over the last cell, or extend to a free neighbour
  const step = (cell: number) => {
    if (!setPath) return;
    const last = path[path.length - 1];
    if (cell === last) return;
    if (path.length > 1 && cell === path[path.length - 2]) return setPath(path.slice(0, -1));
    const at = path.indexOf(cell);
    if (at >= 0) return setPath(path.slice(0, at + 1));
    if (last !== undefined && adjacent(last, cell)) setPath([...path, cell]);
  };

  const down = (cell: number) => {
    if (!setPath) return;
    dragging.current = true;
    if (!path.length) return cell === first && setPath([cell]);
    const at = path.indexOf(cell);
    if (at >= 0) setPath(path.slice(0, at + 1));
    else step(cell);
  };

  const move = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const cell = el?.closest<HTMLElement>("[data-cell]")?.dataset.cell;
    if (cell !== undefined) step(Number(cell));
  };

  const centre = (i: number) => `${(i % n) + 0.5},${Math.floor(i / n) + 0.5}`;
  const visited = new Set(path);

  return (
    <div
      className={`pz-grid path ${open ? "maze" : ""}`}
      style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
      onPointerMove={move}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      {Array.from({ length: n * n }, (_, i) => {
        const r = Math.floor(i / n), c = i % n;
        let walls = "";
        if (open) {
          if (r === 0 || !(open[i - n] & 2)) walls += " wt";
          if (c === 0 || !(open[i - 1] & 1)) walls += " wl";
          if (c === n - 1 || !(open[i] & 1)) walls += " wr";
          if (r === n - 1 || !(open[i] & 2)) walls += " wb";
        }
        return (
          <div
            key={i}
            data-cell={i}
            className={`pz-cell${walls}${visited.has(i) ? " on" : ""}`}
            onPointerDown={(e) => {
              (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
              down(i);
            }}
          >
            {numberAt.has(i) && <span className={`pz-num ${visited.has(i) ? "hit" : ""}`}>{numberAt.get(i)}</span>}
            {open && i === start && <Rocket size={18} className="pz-start" />}
            {open && i === end && <Flag size={18} className="pz-end" />}
          </div>
        );
      })}
      <svg className="pz-line" viewBox={`0 0 ${n} ${n}`} preserveAspectRatio="none" aria-hidden="true">
        {path.length > 1 && <polyline points={path.map(centre).join(" ")} />}
      </svg>
    </div>
  );
}
