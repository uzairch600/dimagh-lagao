"use client";

import { Lightbulb, Tent, TreePine, X } from "lucide-react";
import { AKARI_WALL, akariRays, lightsAfter, neighbours, runs, touches } from "@/lib/puzzle-rules";
import { Clued, Grid } from "../Grid";
import type { PuzzleDef, Step } from "../types";

const ks = (n: number) => [...Array(n).keys()];
const cellsWith = (s: number[], mark: number) => s.flatMap((m, i) => (m === mark ? [i] : []));
// one more mark per tap, wrapping round: 0 → first → second → 0
const cycle = (s: number[], i: number, order: number[]) => s.map((m, k) => (k === i ? order[(order.indexOf(m) + 1) % order.length] : m));
// cells marked one by one, for the walkthrough
function marking(n: number, cells: number[], mark: number, say: (cell: number, k: number) => string | undefined): Step<number[]>[] {
  let s = new Array(n * n).fill(0);
  return cells.map((cell, k) => {
    s = s.map((m, i) => (i === cell ? mark : m));
    return { state: s, at: cell, say: say(cell, k) };
  });
}

// ---------- Batti Gul ----------

type Lights = { on: number[]; taps: number[]; mark?: number[] };

export const lights: PuzzleDef<"lights", Lights> = {
  blurb: "Saari battiyan bujha dein",
  goal: "Saari battiyan bujhani hain. Tap karne se wo batti aur us ke 4 padosi palat jate hain.",
  rules: [
    "Kisi khane par tap karein: wo batti aur us ke upar, neeche, daayen, baayen wali batti palat jati hai.",
    "Jali hui bujh jati hai, bujhi hui jal jati hai.",
    "Saari battiyan bujh jayein to puzzle hal.",
  ],
  how: "Tap karein aur dekhein kya palatta hai. Tip: upar wali row ki jali batti ko us ke neeche wale khane se bujhayein, aur neeche chalte jayein.",
  init: (p) => ({ on: [...p.on], taps: [] }),
  Board: ({ puzzle: p, state: s, set }) => (
    <Grid
      n={p.n}
      cls="lights"
      onTap={set && ((i) => set({ on: lightsAfter(p.n, s.on, [i]), taps: [...s.taps, i] }))}
      cell={(i) => ({ cls: `${s.on[i] ? "lit" : ""} ${s.mark?.includes(i) ? "mark" : ""}`, body: <Lightbulb size={22} /> })}
    />
  ),
  attempt: (_, s) => (s.taps.length && s.on.every((v) => !v) ? s.taps : null),
  shown: (p, sol) => ({ on: [...p.on], taps: [], mark: sol }),
  demo: (p, sol) => {
    let on = p.on;
    return sol.map((cell, k) => {
      on = lightsAfter(p.n, on, [cell]);
      return {
        state: { on, taps: sol.slice(0, k + 1) },
        at: cell,
        say: k === 0 ? "Tap: ye batti aur is ke 4 padosi palat gaye." : k === sol.length - 1 ? "Saari battiyan gul — hal!" : undefined,
      };
    });
  },
};

// ---------- Chhupi Tasveer (nonogram) ----------

export const nonogram: PuzzleDef<"nonogram", number[]> = {
  blurb: "Numbers se chhupi tasveer banayein",
  goal: "Har row aur column ke number batate hain kitne khane saath saath bharne hain, aur kis tarteeb mein.",
  rules: [
    "Row ke saath likhe number: us row mein bhare khanon ke tukre, baayen se daayen.",
    "\"3 1\" ka matlab: pehle 3 bhare khane saath saath, phir kam az kam ek khaali, phir 1.",
    "Column ke upar ke number bhi isi tarah, upar se neeche.",
    "Saare number poore hon to tasveer tayyar.",
  ],
  how: "Ek tap = bhara khana, doosra tap = ✕ (yaqeenan khaali), teesra = saaf. Poora hua number halka ho jata hai.",
  init: (p) => new Array(p.n * p.n).fill(0),
  Board: ({ puzzle: p, state: s, set }) => {
    const n = p.n;
    const rowRuns = ks(n).map((r) => runs(ks(n).map((c) => s[r * n + c] === 1)));
    const colRuns = ks(n).map((c) => runs(ks(n).map((r) => s[r * n + c] === 1)));
    const same = (a: number[], b: number[]) => a.join() === b.join();
    const done = new Set([...ks(n).filter((r) => same(rowRuns[r], p.rows[r])).map((r) => `left${r}`), ...ks(n).filter((c) => same(colRuns[c], p.cols[c])).map((c) => `top${c}`)]);
    return (
      <Clued
        n={n}
        done={done}
        top={p.cols.map((c, k) => <span key={k} className="stack">{c.map((x, j) => <i key={j}>{x}</i>)}</span>)}
        left={p.rows.map((r, k) => <span key={k} className="run">{r.map((x, j) => <i key={j}>{x}</i>)}</span>)}
      >
        <Grid
          n={n}
          cls="nono"
          onTap={set && ((i) => set(cycle(s, i, [0, 1, 2])))}
          cell={(i) => ({ cls: s[i] === 1 ? "fill" : "", body: s[i] === 2 ? <X size={14} strokeWidth={3} className="pz-x" /> : null })}
        />
      </Clued>
    );
  },
  attempt: (p, s) => {
    const n = p.n;
    const ok = ks(n).every((r) => runs(ks(n).map((c) => s[r * n + c] === 1)).join() === p.rows[r].join()) &&
      ks(n).every((c) => runs(ks(n).map((r) => s[r * n + c] === 1)).join() === p.cols[c].join());
    return ok ? cellsWith(s, 1) : null;
  },
  shown: (p, sol) => Array.from({ length: p.n * p.n }, (_, i) => (sol.includes(i) ? 1 : 0)),
  demo: (p, sol) =>
    marking(p.n, [...sol].sort((a, b) => a - b), 1, (_, k) =>
      k === 0 ? "Row ke number = bhare khanon ke tukre. Tap se khana bharein." : k === sol.length - 1 ? "Har row aur column ke number poore — tasveer ban gayi!" : k === 2 ? "Poora hone wala number halka ho jata hai." : undefined,
    ),
};

// ---------- Dohra Hatao (hitori) ----------

export const hitori: PuzzleDef<"hitori", number[]> = {
  blurb: "Dohraye number kaale karein",
  goal: "Kaale khane chunein taa ke kisi row ya column mein koi number dohraya na rahe.",
  rules: [
    "Kisi row ya column mein bache hue (safed) numbers dohraye na hon.",
    "Do kaale khane saath saath (upar-neeche ya daayen-baayen) nahi ho sakte.",
    "Saare safed khane aapas mein jure rahein — koi safed hissa alag na ho.",
  ],
  how: "Ek tap = kaala, doosra tap = ◯ (pakka safed), teesra = saaf. Dohraya number laal dikhta hai.",
  init: (p) => new Array(p.n * p.n).fill(0),
  Board: ({ puzzle: p, state: s, set }) => {
    const n = p.n;
    const bad = new Set<number>();
    for (let a = 0; a < n * n; a++) {
      if (s[a] === 1) {
        if (neighbours(n, a).some((b) => s[b] === 1)) bad.add(a);
        continue;
      }
      for (let b = a + 1; b < n * n; b++) {
        const line = Math.floor(a / n) === Math.floor(b / n) || a % n === b % n;
        if (line && s[b] !== 1 && p.nums[a] === p.nums[b]) { bad.add(a); bad.add(b); }
      }
    }
    return (
      <Grid
        n={n}
        cls="hitori"
        onTap={set && ((i) => set(cycle(s, i, [0, 1, 2])))}
        cell={(i) => ({ cls: `${s[i] === 1 ? "dark" : s[i] === 2 ? "keep" : ""} ${bad.has(i) ? "clash" : ""}`, body: <b>{p.nums[i]}</b> })}
      />
    );
  },
  attempt: (p, s) => {
    const n = p.n;
    for (let a = 0; a < n * n; a++) for (let b = a + 1; b < n * n; b++) {
      const line = Math.floor(a / n) === Math.floor(b / n) || a % n === b % n;
      if (line && s[a] !== 1 && s[b] !== 1 && p.nums[a] === p.nums[b]) return null;
    }
    return cellsWith(s, 1);
  },
  shown: (p, sol) => Array.from({ length: p.n * p.n }, (_, i) => (sol.includes(i) ? 1 : 0)),
  demo: (p, sol) =>
    marking(p.n, sol, 1, (cell, k) =>
      k === sol.length - 1 ? "Koi number dohraya nahi, kaale khane alag alag, safed sab jure — hal!" : k < 2 ? `Yahan ${p.nums[cell]} dohraya tha — ek ko kaala kar diya.` : undefined,
    ),
};

// ---------- Khaime (tents) ----------

export const tents: PuzzleDef<"tents", number[]> = {
  blurb: "Har ped ke saath ek khaima",
  goal: "Har ped ke saath ek khaima. Khaime aapas mein na chhoo'ein. Kinare ke number: us line mein kitne khaime.",
  rules: [
    "Har ped ka apna ek khaima, us ke bilkul saath (upar, neeche, daayen ya baayen).",
    "Do khaime kabhi nahi chhoote — kone (diagonal) se bhi nahi.",
    "Row aur column ke number batate hain us line mein kitne khaime hain.",
  ],
  how: "Ek tap = khaima, doosra tap = ✕ (yahan ghaas), teesra = saaf. Ped par tap nahi hota.",
  init: (p) => new Array(p.n * p.n).fill(0),
  Board: ({ puzzle: p, state: s, set }) => {
    const n = p.n;
    const placed = cellsWith(s, 2);
    const clash = new Set(placed.filter((a) => placed.some((b) => touches(n, a, b))));
    const status = (side: string, have: number, want: number, k: number) => (have > want ? ["bad", `${side}${k}`] : have === want ? ["done", `${side}${k}`] : null);
    const bad = new Set<string>(), done = new Set<string>();
    ks(n).forEach((k) => {
      for (const [side, have, want] of [["left", placed.filter((t) => Math.floor(t / n) === k).length, p.rowCount[k]], ["top", placed.filter((t) => t % n === k).length, p.colCount[k]]] as const) {
        const st = status(side, have, want, k);
        if (st) (st[0] === "bad" ? bad : done).add(st[1]);
      }
    });
    const trees = new Set(p.trees);
    return (
      <Clued n={n} top={p.colCount} left={p.rowCount} bad={bad} done={done}>
        <Grid
          n={n}
          cls="tents"
          onTap={set && ((i) => !trees.has(i) && set(cycle(s, i, [0, 2, 1])))}
          cell={(i) => ({
            cls: `${trees.has(i) ? "tree" : ""} ${clash.has(i) ? "clash" : ""} ${s[i] === 1 ? "grass" : ""}`,
            body: trees.has(i) ? <TreePine size={22} /> : s[i] === 2 ? <Tent size={22} /> : s[i] === 1 ? <i className="pz-dot" /> : null,
          })}
        />
      </Clued>
    );
  },
  attempt: (p, s) => {
    const placed = cellsWith(s, 2);
    return placed.length === p.trees.length ? placed : null;
  },
  shown: (p, sol) => Array.from({ length: p.n * p.n }, (_, i) => (sol.includes(i) ? 2 : 0)),
  demo: (p, sol) =>
    marking(p.n, sol, 2, (_, k) =>
      k === 0 ? "Ped ke bilkul saath khaima (ek tap)." : k === 1 ? "Kinare ke number: us row / column mein kitne khaime." : k === sol.length - 1 ? "Har ped ka khaima, koi do khaime nahi chhoote — hal!" : undefined,
    ),
};

// ---------- Roshni (light up) ----------

export const akari: PuzzleDef<"akari", number[]> = {
  blurb: "Bulb laga kar har khana roshan karein",
  goal: "Bulb laga kar har safed khana roshan karein. Do bulb ek doosre ko roshni na dein. Kaale number = saath lage bulb.",
  rules: [
    "Bulb apni row aur column mein deewar tak roshni deta hai.",
    "Har safed khana roshan hona chahiye.",
    "Koi bulb doosre bulb ki roshni mein nahi ho sakta.",
    "Kaali deewar par number ho to us ke saath (upar, neeche, daayen, baayen) utne hi bulb.",
  ],
  how: "Ek tap = bulb, doosra tap = • (yahan bulb nahi), teesra = saaf. Takrane wale bulb laal ho jate hain.",
  init: (p) => new Array(p.n * p.n).fill(0),
  Board: ({ puzzle: p, state: s, set }) => {
    const n = p.n;
    const bulbs = cellsWith(s, 2);
    const lit = new Set(bulbs);
    const clash = new Set<number>();
    for (const b of bulbs) for (const c of akariRays(n, p.cells, b)) { lit.add(c); if (s[c] === 2) clash.add(b); }
    return (
      <Grid
        n={n}
        cls="akari"
        onTap={set && ((i) => p.cells[i] === -1 && set(cycle(s, i, [0, 2, 1])))}
        cell={(i) => {
          const w = p.cells[i];
          if (w !== -1) {
            const near = neighbours(n, i).filter((j) => s[j] === 2).length;
            return { cls: `wall ${w !== AKARI_WALL && near > w ? "over" : w !== AKARI_WALL && near === w ? "met" : ""}`, body: w !== AKARI_WALL ? <b>{w}</b> : null };
          }
          return {
            cls: `${lit.has(i) ? "lit" : ""} ${clash.has(i) ? "clash" : ""}`,
            body: s[i] === 2 ? <Lightbulb size={22} /> : s[i] === 1 ? <i className="pz-dot" /> : null,
          };
        }}
      />
    );
  },
  attempt: (p, s) => {
    const bulbs = cellsWith(s, 2);
    const lit = new Set(bulbs);
    for (const b of bulbs) for (const c of akariRays(p.n, p.cells, b)) lit.add(c);
    return p.cells.every((w, i) => w !== -1 || lit.has(i)) ? bulbs : null;
  },
  shown: (p, sol) => Array.from({ length: p.n * p.n }, (_, i) => (sol.includes(i) ? 2 : 0)),
  demo: (p, sol) =>
    marking(p.n, sol, 2, (_, k) =>
      k === 0 ? "Bulb apni row aur column mein deewar tak roshni deta hai." : k === 1 ? "Kaali deewar ka number = us ke saath lage bulb." : k === sol.length - 1 ? "Har safed khana roshan — hal!" : undefined,
    ),
};
