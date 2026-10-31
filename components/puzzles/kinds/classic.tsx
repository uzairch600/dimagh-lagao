"use client";

import { touches } from "@/lib/puzzle-rules";
import CrownsBoard from "../CrownsBoard";
import PathBoard from "../PathBoard";
import SunMoonBoard from "../SunMoonBoard";
import type { PuzzleDef, Step } from "../types";

// a line drawn one cell at a time, for the walkthrough
const drawing = (cells: number[], say: (k: number) => string | undefined, from = 1): Step<number[]>[] =>
  cells.slice(from - 1).map((_, k) => ({ state: cells.slice(0, k + from), at: cells[k + from - 1], say: say(k + from - 1) }));

export const crowns: PuzzleDef<"crowns", number[]> = {
  blurb: "Har row, column aur rang mein ek taaj",
  goal: "Har row, har column aur har rang mein sirf ek taaj. Taaj aapas mein na chhoo'ein — kone se bhi nahi.",
  rules: [
    "Har row mein sirf ek taaj.",
    "Har column mein sirf ek taaj.",
    "Har rang ke hisse mein sirf ek taaj.",
    "Do taaj aapas mein nahi chhoo sakte — kone (diagonal) se bhi nahi.",
  ],
  how: "Ek tap = ✕ (yahan taaj nahi ho sakta), doosra tap = taaj, teesra tap = khaali. Qawaid toote to taaj laal ho jata hai.",
  init: (p) => new Array(p.n * p.n).fill(0),
  Board: ({ puzzle, state, set }) => (
    <CrownsBoard
      n={puzzle.n}
      regions={puzzle.regions}
      marks={state}
      onTap={set && ((i) => set(state.map((m, k) => (k === i ? (m + 1) % 3 : m))))}
    />
  ),
  attempt: (p, s) => {
    const crowns = s.flatMap((m, i) => (m === 2 ? [i] : []));
    return crowns.length === p.n ? crowns : null;
  },
  shown: (p, sol) => Array.from({ length: p.n * p.n }, (_, i) => (sol.includes(i) ? 2 : 0)),
  demo: (p, sol) => {
    const { n, regions } = p;
    const steps: Step<number[]>[] = [];
    let marks = new Array(n * n).fill(0);
    [...sol].sort((a, b) => a - b).forEach((cell, k) => {
      marks = marks.map((m, i) => (i === cell ? 2 : m));
      steps.push({
        state: marks,
        at: cell,
        say: k === 0 ? "Do tap = taaj. Pehli row mein taaj yahan." : k === n - 1 ? "Aakhri taaj — har row, column aur rang mein ek. Hal!" : k < 2 ? undefined : `Row ${k + 1}: bachi hui jagah par taaj.`,
      });
      // the first two crowns also show what they rule out
      if (k < 2) {
        const out = (i: number) =>
          i !== cell && (Math.floor(i / n) === Math.floor(cell / n) || i % n === cell % n || regions[i] === regions[cell] || touches(n, i, cell));
        marks = marks.map((m, i) => (m === 0 && out(i) ? 1 : m));
        steps.push({ state: marks, say: "Ab is taaj ki row, column, rang aur aas paas ke khane ✕ — wahan doosra taaj nahi aa sakta." });
      }
    });
    return steps;
  },
};

export const sunmoon: PuzzleDef<"sunmoon", number[]> = {
  blurb: "Suraj aur chaand ka sahi jor",
  goal: "Har row aur column mein aadhe suraj, aadhe chaand. Ek line mein 3 ek jaise nahi. = matlab same, × matlab alag.",
  rules: [
    "Har khane mein suraj ya chaand.",
    "Har row aur har column mein aadhe suraj, aadhe chaand.",
    "Ek line mein 3 suraj ya 3 chaand saath saath nahi.",
    "= ka matlab dono khane same, × ka matlab dono alag.",
  ],
  how: "Khaali khane par tap: suraj → chaand → khaali. Gehre khane pehle se bhare hain, badle nahi ja sakte.",
  init: (p) => [...p.givens],
  Board: ({ puzzle, state, set }) => (
    <SunMoonBoard
      n={puzzle.n}
      givens={puzzle.givens}
      hints={puzzle.hints}
      values={state}
      onTap={set && ((i) => set(state.map((v, k) => (k === i ? (v === -1 ? 0 : v === 0 ? 1 : -1) : v))))}
    />
  ),
  attempt: (_, s) => (s.every((v) => v !== -1) ? s : null),
  shown: (_, sol) => sol,
  demo: (p, sol) => {
    let v = [...p.givens];
    const empty = sol.flatMap((_, i) => (p.givens[i] === -1 ? [i] : []));
    let sunSaid = false, moonSaid = false;
    return empty.map((cell, k) => {
      v = v.map((x, i) => (i === cell ? sol[i] : x));
      const hint = p.hints.find(([a, b]) => (a === cell || b === cell) && v[a] !== -1 && v[b] !== -1);
      let say: string | undefined;
      if (k === empty.length - 1) say = `Har row aur column mein ${p.n / 2} suraj, ${p.n / 2} chaand. Hal!`;
      else if (hint) say = hint[2] ? "= ka matlab dono same — is liye yahan bhi wahi." : "× ka matlab dono alag — is liye yahan ulta.";
      else if (sol[cell] === 0 && !sunSaid) { sunSaid = true; say = "Ek tap = suraj ☀"; }
      else if (sol[cell] === 1 && !moonSaid) { moonSaid = true; say = "Do tap = chaand ☾"; }
      return { state: v, at: cell, say };
    });
  },
};

export const path: PuzzleDef<"path", number[]> = {
  blurb: "1, 2, 3… jorein, har khana bharein",
  goal: "1 se shuru karein aur numbers ko tarteeb se jorte hue har khana bharein.",
  rules: [
    "Raasta 1 se shuru ho kar aakhri number par khatam ho.",
    "Numbers tarteeb se aayein: 1, phir 2, phir 3…",
    "Har khane se raasta sirf ek dafa guzre — koi khana khaali na rahe.",
    "Raasta sirf upar, neeche, daayen, baayen chalta hai (tircha nahi).",
  ],
  how: "1 par ungli rakhein aur kheenchte jayein. Peechhe le jaane se raasta mit jata hai.",
  init: () => [],
  Board: ({ puzzle, state, set }) => <PathBoard n={puzzle.n} numbers={puzzle.numbers} path={state} setPath={set} />,
  attempt: (p, s) => (s.length === p.n * p.n ? s : null),
  shown: (_, sol) => sol,
  demo: (p, sol) => {
    const num = new Map(p.numbers);
    const last = p.numbers.length;
    return drawing(sol, (k) => {
      const at = num.get(sol[k]);
      if (k === 0) return "1 par ungli rakh kar kheenchna shuru karein.";
      if (k === sol.length - 1) return `${last} tak, har khana bhar ke. Hal!`;
      return at ? `${at} aa gaya — ab ${at + 1} ki taraf, raaste ke khane bharte hue.` : undefined;
    });
  },
};

export const maze: PuzzleDef<"maze", number[]> = {
  blurb: "Rocket ko jhande tak pohanchayein",
  goal: "Rocket se jhande tak raasta kheenchein. Deewaron ke aar paar nahi ja sakte.",
  rules: ["Rocket se shuru karein aur jhande tak pohanchein.", "Deewaron ke aar paar nahi ja sakte."],
  how: "Rocket se ungli kheenchte hue raasta banayein. Ghalat gali mein gaye to peechhe kheench lein.",
  init: (p) => [p.start],
  Board: ({ puzzle, state, set }) => (
    <PathBoard n={puzzle.n} open={puzzle.open} start={puzzle.start} end={puzzle.end} path={state.length ? state : [puzzle.start]} setPath={set} />
  ),
  attempt: (p, s) => (s[s.length - 1] === p.end ? s : null),
  shown: (_, sol) => sol,
  demo: (_, sol) => drawing(sol, (k) => (k === 1 ? "Rocket se khuli gali mein kheenchein." : k === sol.length - 1 ? "Jhanda mil gaya — hal!" : undefined), 2),
};

export const oneline: PuzzleDef<"oneline", number[]> = {
  blurb: "Ek hi lakeer se har khana",
  goal: "● se shuru karein aur ek hi lakeer se har khula khana bharein.",
  rules: [
    "Lakeer ● wale khane se shuru hoti hai.",
    "Har khula khana ek hi dafa — koi khaali na rahe.",
    "Kaale khanon mein nahi ja sakte.",
    "Sirf upar, neeche, daayen, baayen (tircha nahi). Lakeer kahin bhi khatam ho sakti hai.",
  ],
  how: "● se ungli kheenchte jayein. Phans jayein to peechhe kheench kar doosra raasta lein.",
  init: (p) => [p.start],
  Board: ({ puzzle, state, set }) => <PathBoard n={puzzle.n} blocked={puzzle.blocked} start={puzzle.start} path={state.length ? state : [puzzle.start]} setPath={set} />,
  attempt: (p, s) => (s.length === p.n * p.n - p.blocked.length ? s : null),
  shown: (_, sol) => sol,
  demo: (_, sol) =>
    drawing(sol, (k) => (k === 1 ? "● se kheenchna shuru — kone wale khane pehle bharein taa ke phans na jayein." : k === sol.length - 1 ? "Har khula khana ek dafa — hal!" : undefined), 2),
};
