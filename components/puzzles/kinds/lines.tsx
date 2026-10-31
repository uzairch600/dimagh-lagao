"use client";

import { useRef } from "react";
import { Droplet } from "lucide-react";
import { isNext, lineCells, pipesFlow, splitLines, turn } from "@/lib/puzzle-rules";
import { Grid } from "../Grid";
import type { BoardProps, PuzzleDef, Step } from "../types";
import { PAINT } from "./moves";

const LINK_COLORS = [...PAINT, "#7fe0ff", "#ff8fd8"];
const centre = (n: number, i: number) => `${(i % n) + 0.5},${Math.floor(i / n) + 0.5}`;

// The cell under the finger while dragging (pointer events stay on the cell where the drag began).
const cellAt = (e: React.PointerEvent) => {
  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
  const v = el?.closest<HTMLElement>("[data-cell]")?.dataset.cell;
  return v === undefined ? null : Number(v);
};

// ---------- Rang Jor (colour link) ----------

function LinkBoard({ puzzle: p, state: lines, set }: BoardProps<"link", number[][]>) {
  const n = p.n;
  const active = useRef<number | null>(null);
  const endOf = new Map<number, number>();
  p.ends.forEach(([a, b], k) => { endOf.set(a, k); endOf.set(b, k); });
  const owner = new Map<number, number>();
  lines.forEach((l, k) => l.forEach((c) => owner.set(c, k)));
  const closed = (k: number) => lines[k].length > 1 && endOf.get(lines[k][lines[k].length - 1]) === k;

  const down = (cell: number) => {
    if (!set) return;
    const e = endOf.get(cell);
    const k = e ?? owner.get(cell);
    if (k === undefined) return;
    active.current = k;
    // a dot starts its line again; a cell on a line cuts the line back to it
    set(lines.map((l, j) => (j !== k ? l : e !== undefined ? [cell] : l.slice(0, l.indexOf(cell) + 1))));
  };
  const step = (cell: number) => {
    const k = active.current;
    if (k === null || !set) return;
    const line = lines[k];
    const last = line[line.length - 1];
    if (cell === last) return;
    const at = line.indexOf(cell);
    if (at >= 0) return set(lines.map((l, j) => (j === k ? l.slice(0, at + 1) : l)));
    if (closed(k) || !isNext(n, last, cell)) return;
    const e = endOf.get(cell);
    if (e !== undefined && e !== k) return; // another colour's dot
    // running over another colour's line cuts that line short
    set(lines.map((l, j) => (j === k ? [...l, cell] : l.includes(cell) ? l.slice(0, l.indexOf(cell)) : l)));
  };

  return (
    <div
      className="pz-grid link"
      style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
      onPointerMove={(e) => { const c = active.current !== null ? cellAt(e) : null; if (c !== null) step(c); }}
      onPointerUp={() => (active.current = null)}
      onPointerLeave={() => (active.current = null)}
    >
      {Array.from({ length: n * n }, (_, i) => {
        const k = owner.get(i);
        const e = endOf.get(i);
        return (
          <div
            key={i}
            data-cell={i}
            className="pz-cell"
            style={k !== undefined ? { background: `${LINK_COLORS[k]}33` } : undefined}
            onPointerDown={(ev) => { (ev.target as HTMLElement).releasePointerCapture?.(ev.pointerId); down(i); }}
          >
            {e !== undefined && <span className={`pz-dot-end ${closed(e) ? "done" : ""}`} style={{ background: LINK_COLORS[e] }} />}
          </div>
        );
      })}
      <svg className="pz-line" viewBox={`0 0 ${n} ${n}`} preserveAspectRatio="none" aria-hidden="true">
        {lines.map((l, k) => l.length > 1 && <polyline key={k} points={l.map((c) => centre(n, c)).join(" ")} style={{ stroke: LINK_COLORS[k] }} />)}
      </svg>
    </div>
  );
}

export const link: PuzzleDef<"link", number[][]> = {
  blurb: "Ek rang ke dots jorein, har khana bharein",
  goal: "Har rang ke do dots ko lakeer se jorein. Lakeerein ek doosre ko na kaatein, aur har khana bhar jaye.",
  rules: [
    "Ek rang ke dono dots ko ek lakeer se jorein.",
    "Lakeerein ek doosre ke upar se nahi guzar saktin.",
    "Har khana kisi na kisi lakeer se bharna hai.",
    "Lakeer sirf upar, neeche, daayen, baayen (tircha nahi).",
  ],
  how: "Dot se ungli kheench kar doosre dot tak le jayein. Lakeer par tap karne se wahan tak reh jati hai.",
  init: (p) => p.ends.map(() => []),
  Board: LinkBoard,
  attempt: (p, lines) => {
    const done = lines.every((l, k) => l.length > 1 && p.ends[k].includes(l[0]) && p.ends[k].includes(l[l.length - 1]));
    return done && lines.flat().length === p.n * p.n ? lines.flatMap((l, k) => (k ? [-1, ...l] : l)) : null;
  },
  shown: (_, sol) => splitLines(sol),
  demo: (p, sol) => {
    const all = splitLines(sol);
    const steps: Step<number[][]>[] = [];
    const lines: number[][] = p.ends.map(() => []);
    all.forEach((line, k) => line.forEach((cell, j) => {
      lines[k] = line.slice(0, j + 1);
      const last = k === all.length - 1 && j === line.length - 1;
      steps.push({
        state: lines.map((l) => [...l]),
        at: cell,
        say: last ? "Saare rang jure, har khana bhara — hal!" : j === 0 && k === 0 ? "Dot se kheenchna shuru…" : j === line.length - 1 && k === 0 ? "…usi rang ke doosre dot tak. Ek rang jur gaya." : undefined,
      });
    }));
    return steps;
  },
};

// ---------- Lafz Dhoondo (word search) ----------

type Words = { found: number[]; drag: [number, number] | null };

function WordsBoard({ puzzle: p, state: s, set }: BoardProps<"words", Words>) {
  const n = p.n;
  const dragging = useRef(false);
  // finish a selection from a to b: keep it if it spells a word still to find (either way round)
  const finish = (a: number, b: number) => {
    if (!set) return;
    const cells = lineCells(n, a, b);
    const spelled = cells ? cells.map((i) => p.letters[i]).join("") : "";
    const k = p.words.findIndex((w, j) => s.found[2 * j] === -1 && a !== b && (w === spelled || w === [...spelled].reverse().join("")));
    if (k < 0) return set({ ...s, drag: a === b ? [a, a] : null });
    const found = [...s.found];
    [found[2 * k], found[2 * k + 1]] = p.words[k] === spelled ? [a, b] : [b, a];
    set({ found, drag: null });
  };
  const down = (cell: number) => {
    if (!set) return;
    // tap a first letter, then tap a last letter, also works
    if (s.drag && s.drag[0] === s.drag[1] && cell !== s.drag[0] && lineCells(n, s.drag[0], cell)) return finish(s.drag[0], cell);
    dragging.current = true;
    set({ ...s, drag: [cell, cell] });
  };
  const line = (a: number, b: number, color: string, key: string | number) => {
    const [x1, y1] = centre(n, a).split(",").map(Number);
    const [x2, y2] = centre(n, b).split(",").map(Number);
    return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: color }} />;
  };
  return (
    <div className="pz-stack">
      <div
        className="pz-grid words"
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
        onPointerMove={(e) => {
          if (!dragging.current || !s.drag) return;
          const c = cellAt(e);
          if (c !== null && c !== s.drag[1] && lineCells(n, s.drag[0], c)) set?.({ ...s, drag: [s.drag[0], c] });
        }}
        onPointerUp={() => { if (dragging.current && s.drag) finish(s.drag[0], s.drag[1]); dragging.current = false; }}
        onPointerLeave={() => { if (dragging.current) set?.({ ...s, drag: null }); dragging.current = false; }}
      >
        <svg className="pz-marks" viewBox={`0 0 ${n} ${n}`} preserveAspectRatio="none" aria-hidden="true">
          {p.words.map((_, k) => s.found[2 * k] >= 0 && line(s.found[2 * k], s.found[2 * k + 1], `${LINK_COLORS[k % LINK_COLORS.length]}99`, k))}
          {s.drag && line(s.drag[0], s.drag[1], "rgba(124, 92, 255, 0.55)", "drag")}
        </svg>
        {[...p.letters].map((ch, i) => (
          <div key={i} data-cell={i} className="pz-cell" onPointerDown={(e) => { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); down(i); }}>
            {ch}
          </div>
        ))}
      </div>
      <div className="pz-wordlist">
        <small>{p.theme}</small>
        {p.words.map((w, k) => <span key={w} className={s.found[2 * k] >= 0 ? "got" : ""}>{w}</span>)}
      </div>
    </div>
  );
}

export const words: PuzzleDef<"words", Words> = {
  blurb: "Chhupe hue lafz dhoondein",
  goal: "Neeche diye gaye saare lafz board mein dhoondein: seedhe, neeche ya tirchhe.",
  rules: [
    "Har lafz board mein ek seedhi line mein chhupa hai: daayen, neeche ya tirchha.",
    "Mushkil board par lafz ulte bhi ho sakte hain.",
    "Saare lafz mil jayein to puzzle hal.",
  ],
  how: "Lafz ke pehle harf se aakhri harf tak ungli kheenchein — ya pehle harf ko tap, phir aakhri ko tap.",
  init: (p) => ({ found: p.words.flatMap(() => [-1, -1]), drag: null }),
  Board: WordsBoard,
  attempt: (_, s) => (s.found.every((x) => x >= 0) ? s.found : null),
  shown: (_, sol) => ({ found: sol, drag: null }),
  demo: (p, sol) => {
    const steps: Step<Words>[] = [];
    let found = p.words.flatMap(() => [-1, -1]);
    p.words.forEach((w, k) => {
      const [a, b] = [sol[2 * k], sol[2 * k + 1]];
      steps.push({ state: { found, drag: [a, a] }, at: a, say: k === 0 ? `"${w}" ka pehla harf…` : undefined });
      steps.push({ state: { found, drag: [a, b] }, at: b, say: k === 0 ? "…aakhri harf tak kheenchein." : undefined });
      found = found.map((x, j) => (j === 2 * k ? a : j === 2 * k + 1 ? b : x));
      steps.push({ state: { found, drag: null }, at: b, say: k === p.words.length - 1 ? "Saare lafz mil gaye — hal!" : k === 0 ? `"${w}" mil gaya!` : undefined });
    });
    return steps;
  },
};

// ---------- Pipe Jor ----------

const ARM: Record<number, string> = { 1: "M5 5V0", 2: "M5 5H10", 4: "M5 5V10", 8: "M5 5H0" };

export const pipes: PuzzleDef<"pipes", number[]> = {
  blurb: "Pipe ghuma kar paani har jagah pohanchayein",
  goal: "Pipes ko tap kar ke ghumayein taa ke paani har pipe tak pohanche aur koi sira khula na rahe.",
  rules: [
    "Tap karne se pipe ghari ki seedh mein chauthai chakkar ghoomta hai.",
    "Paani beech wale nalke (💧) se nikalta hai.",
    "Har pipe ka har sira kisi doosre pipe se jura ho — koi sira khula ya board se bahar na ho.",
    "Paani saare pipes tak pohanch jaye to hal.",
  ],
  how: "Pipe par tap = ghumayein. Jin pipes tak paani pohanch gaya wo neele ho jate hain.",
  init: (p) => p.tiles.map(() => 0),
  Board: ({ puzzle: p, state: s, set }) => {
    const { wet } = pipesFlow(p.n, p.tiles.map((m, i) => turn(m, s[i])), p.source);
    return (
      <Grid
        n={p.n}
        cls="pipes"
        onTap={set && ((i) => set(s.map((x, k) => (k === i ? x + 1 : x))))}
        cell={(i) => ({
          cls: wet.has(i) ? "wet" : "",
          body: (
            <>
              <svg viewBox="0 0 10 10" style={{ transform: `rotate(${s[i] * 90}deg)` }} aria-hidden="true">
                {[1, 2, 4, 8].filter((b) => p.tiles[i] & b).map((b) => <path key={b} d={ARM[b]} />)}
                <circle cx="5" cy="5" r="1.4" />
              </svg>
              {i === p.source && <Droplet size={16} className="pz-source" />}
            </>
          ),
        })}
      />
    );
  },
  attempt: (p, s) => {
    const { wet, loose } = pipesFlow(p.n, p.tiles.map((m, i) => turn(m, s[i])), p.source);
    return wet.size === p.n * p.n && !loose.size ? s.map((x) => x % 4) : null;
  },
  shown: (_, sol) => sol,
  demo: (p, sol) => {
    const steps: Step<number[]>[] = [];
    let s = p.tiles.map(() => 0);
    const cells = sol.flatMap((t, i) => (t ? [i] : []));
    cells.forEach((cell, k) => {
      for (let t = 1; t <= sol[cell]; t++) {
        s = s.map((x, i) => (i === cell ? x + 1 : x));
        const last = k === cells.length - 1 && t === sol[cell];
        steps.push({ state: s, at: cell, say: last ? "Paani har pipe tak, koi sira khula nahi — hal!" : k === 0 && t === 1 ? "Tap: pipe ghoom gaya." : k === 1 && t === 1 ? "Jahan tak paani pohancha, wo pipes neele." : undefined });
      }
    });
    return steps;
  },
};
