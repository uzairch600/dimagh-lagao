"use client";

import { boxOf, visible } from "@/lib/puzzle-rules";
import { Clued, Grid, NumPad } from "../Grid";
import type { PuzzleDef, Step } from "../types";

// Number grids: tap a cell to pick it, then a number below. v = every cell's number (0 = empty), sel = picked cell.
type Nums = { v: number[]; sel: number };

// cells whose number repeats in their row, column (or sudoku box)
function repeats(n: number, v: number[], box?: [number, number]) {
  const bad = new Set<number>();
  for (let a = 0; a < n * n; a++) for (let b = a + 1; b < n * n; b++) {
    if (!v[a] || v[a] !== v[b]) continue;
    const same = Math.floor(a / n) === Math.floor(b / n) || a % n === b % n || (box && boxOf(n, box, a) === boxOf(n, box, b));
    if (same) { bad.add(a); bad.add(b); }
  }
  return bad;
}

function NumGrid({ n, givens, s, set, bad, cellCls, extra }: {
  n: number; givens: number[]; s: Nums; set?: (s: Nums) => void; bad: Set<number>;
  cellCls?: (i: number) => string; extra?: (i: number) => React.ReactNode;
}) {
  return (
    <Grid
      n={n}
      cls="num"
      onTap={set && ((i) => !givens[i] && set({ ...s, sel: i }))}
      cell={(i) => ({
        cls: `${givens[i] ? "fixed" : ""} ${s.sel === i ? "sel" : ""} ${bad.has(i) ? "clash" : ""} ${cellCls?.(i) ?? ""}`,
        body: (
          <>
            {s.v[i] ? <b>{s.v[i]}</b> : null}
            {extra?.(i)}
          </>
        ),
      })}
    />
  );
}

const pad = (n: number, s: Nums, set?: (s: Nums) => void) => (
  <NumPad n={n} onPick={set && ((d) => s.sel >= 0 && set({ ...s, v: s.v.map((x, i) => (i === s.sel ? d : x)) }))} />
);

const numsBase = {
  init: (p: { givens: number[] }): Nums => ({ v: [...p.givens], sel: -1 }),
  attempt: (_: unknown, s: Nums) => (s.v.every(Boolean) ? s.v : null),
  shown: (_: unknown, sol: number[]): Nums => ({ v: sol, sel: -1 }),
};

// Walkthrough: pick each empty cell, then tap its number.
function fillIn(givens: number[], sol: number[], say: (cell: number, k: number, total: number) => string | undefined): Step<Nums>[] {
  const empty = sol.flatMap((_, i) => (givens[i] ? [] : [i]));
  let v = [...givens];
  return empty.flatMap((cell, k) => {
    const pickStep = { state: { v, sel: cell }, at: cell, say: k === 0 ? "Pehle khaali khane par tap karein…" : undefined };
    v = v.map((x, i) => (i === cell ? sol[i] : x));
    return [pickStep, { state: { v, sel: cell }, at: `num-${sol[cell]}`, say: k === 0 ? "…phir neeche se number dabayein." : say(cell, k, empty.length) }];
  });
}

export const sudoku: PuzzleDef<"sudoku", Nums> = {
  ...numsBase,
  blurb: "Har row, column aur dabbe mein 1 se 6",
  goal: "Har row, har column aur har mote dabbe mein har number sirf ek dafa.",
  rules: [
    "Har khane mein ek number.",
    "Har row mein har number sirf ek dafa.",
    "Har column mein har number sirf ek dafa.",
    "Har mote dabbe mein bhi har number sirf ek dafa.",
  ],
  how: "Khane par tap karein, phir neeche se number. Mitane ke liye rubber. Dohraya number laal ho jata hai.",
  Board: ({ puzzle: p, state: s, set }) => {
    const [br, bc] = p.box;
    return (
      <div className="pz-stack">
        <NumGrid
          n={p.n}
          givens={p.givens}
          s={s}
          set={set}
          bad={repeats(p.n, s.v, p.box)}
          cellCls={(i) => `${(i % p.n) % bc === 0 && i % p.n ? "bl" : ""} ${Math.floor(i / p.n) % br === 0 && i >= p.n ? "bt" : ""}`}
        />
        {set && pad(p.n, s, set)}
      </div>
    );
  },
  demo: (p, sol) =>
    fillIn(p.givens, sol, (cell, k, total) =>
      k === total - 1 ? "Har row, column aur dabba poora — hal!" : k === 1 ? `Is row, column aur dabbe mein ${sol[cell]} abhi nahi tha — to yahan ${sol[cell]}.` : undefined,
    ),
};

export const futoshiki: PuzzleDef<"futoshiki", Nums> = {
  ...numsBase,
  blurb: "Chhota bara ke nishan maan kar number bharein",
  goal: "Har row aur column mein 1 se n tak har number ek dafa. Nishan ka munh hamesha bare number ki taraf khulta hai.",
  rules: [
    "Har row mein har number sirf ek dafa.",
    "Har column mein har number sirf ek dafa.",
    "< aur > ke nishan maanne hain: nishan ka khula munh bare number ki taraf.",
    "∧ / ∨ upar neeche ke liye: nukeela sira chhote number ki taraf.",
  ],
  how: "Khane par tap karein, phir neeche se number. Galti laal ho jati hai.",
  Board: ({ puzzle: p, state: s, set }) => {
    const bad = repeats(p.n, s.v);
    for (const [a, b] of p.signs) if (s.v[a] && s.v[b] && s.v[a] >= s.v[b]) { bad.add(a); bad.add(b); }
    // each sign sits on the right or bottom edge of the earlier cell
    const signAt = (i: number) =>
      p.signs.flatMap(([a, b]) => {
        const lo = Math.min(a, b);
        if (lo !== i) return [];
        if (Math.abs(a - b) === 1) return [<span key="h" className="pz-hint h">{a < b ? "<" : ">"}</span>];
        return [<span key="v" className="pz-hint v">{a < b ? "∧" : "∨"}</span>];
      });
    return (
      <div className="pz-stack">
        <NumGrid n={p.n} givens={p.givens} s={s} set={set} bad={bad} extra={signAt} cellCls={() => "gap"} />
        {set && pad(p.n, s, set)}
      </div>
    );
  },
  demo: (p, sol) =>
    fillIn(p.givens, sol, (cell, k, total) => {
      if (k === total - 1) return "Har nishan sahi, har line mein har number ek dafa — hal!";
      const sign = p.signs.find(([a, b]) => a === cell || b === cell);
      return sign && k < total - 1 ? `Nishan dekhein: ${sol[sign[0]]} chhota, ${sol[sign[1]]} bara.` : undefined;
    }),
};

export const skyscraper: PuzzleDef<"skyscraper", Nums> = {
  ...numsBase,
  blurb: "Kinare se kitni imaratein nazar aati hain?",
  goal: "Har number ek imarat ki oonchai. Kinare ka number: us taraf se kitni imaratein nazar aati hain.",
  rules: [
    "Har khane mein ek imarat: 1 sab se neechi, sab se bara number sab se ooncha.",
    "Har row aur column mein har oonchai sirf ek dafa.",
    "Kinare ka number batata hai ke us taraf se dekhein to kitni imaratein nazar aati hain.",
    "Oonchi imarat apne peechhe wali neechi imaraton ko chhupa leti hai.",
  ],
  how: "Khane par tap karein, phir neeche se number. Line poori ho aur ginti ghalat ho to kinare ka number laal.",
  Board: ({ puzzle: p, state: s, set }) => {
    const n = p.n;
    const ks = [...Array(n).keys()];
    const row = (r: number) => ks.map((c) => s.v[r * n + c]);
    const col = (c: number) => ks.map((r) => s.v[r * n + c]);
    const badClues = new Set<string>();
    const judge = (side: string, k: number, line: number[], clue: number) => {
      if (clue && line.every(Boolean) && visible(line) !== clue) badClues.add(`${side}${k}`);
    };
    ks.forEach((k) => {
      judge("top", k, col(k), p.top[k]);
      judge("bottom", k, col(k).reverse(), p.bottom[k]);
      judge("left", k, row(k), p.left[k]);
      judge("right", k, row(k).reverse(), p.right[k]);
    });
    const show = (list: number[]) => list.map((c) => c || null);
    return (
      <div className="pz-stack">
        <Clued n={n} top={show(p.top)} bottom={show(p.bottom)} left={show(p.left)} right={show(p.right)} bad={badClues}>
          <NumGrid n={n} givens={p.givens} s={s} set={set} bad={repeats(n, s.v)} cellCls={(i) => `tower t${s.v[i]}`} />
        </Clued>
        {set && pad(n, s, set)}
      </div>
    );
  },
  demo: (p, sol) => {
    const steps = fillIn(p.givens, sol, (cell, k, total) => {
      if (k === total - 1) return "Har kinare ki ginti poori — hal!";
      if (sol[cell] === p.n && k < 4) return `${p.n} sab se oonchi imarat hai — wo apne peechhe sab kuch chhupa leti hai.`;
      return undefined;
    });
    if (steps.length) steps[0] = { ...steps[0], say: "Kinare ka number = us taraf se nazar aane wali imaratein. Pehle khane par tap…" };
    return steps;
  },
};
