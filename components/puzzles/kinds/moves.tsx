"use client";

import { Target as TargetIcon } from "lucide-react";
import { OPS, ballsDone, ballsMove, floodPaint, isNext, neighbours, slideDone, targetStep } from "@/lib/puzzle-rules";
import { Grid } from "../Grid";
import type { PuzzleDef, Step } from "../types";

export const PAINT = ["#ff6b8b", "#ffcf5a", "#4fd1a5", "#5fa8ff", "#b48cff", "#ff9f5a"];

// ---------- Khiskao (sliding tiles) ----------

type Slide = { tiles: number[]; moves: number[] };

export const slide: PuzzleDef<"slide", Slide> = {
  blurb: "Tukre khiska kar 1, 2, 3… tarteeb",
  goal: "Khaali jagah ke saath wale tukre par tap karein aur sab tukre 1 se tarteeb mein laayein.",
  rules: [
    "Sirf khaali jagah ke saath wala tukra (upar, neeche, daayen, baayen) khisak sakta hai.",
    "Tukre ko tap karein, wo khaali jagah mein chala jayega.",
    "1, 2, 3… baayen se daayen, upar se neeche — khaali jagah aakhir mein.",
  ],
  how: "Khaali jagah ke saath wale tukre par tap. Tip: pehle upar wali row poori karein, phir agli.",
  init: (p) => ({ tiles: [...p.tiles], moves: [] }),
  Board: ({ puzzle: p, state: s, set }) => {
    const gap = s.tiles.indexOf(0);
    const total = p.n * p.n - 1;
    return (
      <Grid
        n={p.n}
        cls="slide"
        onTap={set && ((i) => {
          if (!isNext(p.n, gap, i)) return;
          const tiles = [...s.tiles];
          [tiles[gap], tiles[i]] = [tiles[i], 0];
          set({ tiles, moves: [...s.moves, i] });
        })}
        cell={(i) => {
          const t = s.tiles[i];
          if (!t) return { cls: "gap" };
          return {
            cls: `${t === i + 1 ? "home" : ""} ${isNext(p.n, gap, i) ? "can" : ""}`,
            style: { background: `hsl(${250 + (t / total) * 110} 80% ${t === i + 1 ? 68 : 60}%)` },
            body: <b>{t}</b>,
          };
        }}
      />
    );
  },
  attempt: (_, s) => (s.moves.length && slideDone(s.tiles) ? s.moves : null),
  shown: (p) => ({ tiles: p.tiles.map((_, i) => (i + 1) % p.tiles.length), moves: [] }),
  demo: (p, sol) => {
    let tiles = [...p.tiles];
    return sol.map((cell, k) => {
      const gap = tiles.indexOf(0);
      tiles = [...tiles];
      [tiles[gap], tiles[cell]] = [tiles[cell], 0];
      return {
        state: { tiles, moves: sol.slice(0, k + 1) },
        at: cell,
        say: k === 0 ? "Khaali jagah ke saath wale tukre par tap — wo khisak gaya." : k === sol.length - 1 ? "1 se 8 tak tarteeb — hal!" : undefined,
      };
    });
  },
};

// ---------- Rang Bhar (flood) ----------

type Flood = { grid: number[]; picks: number[] };

export const flood: PuzzleDef<"flood", Flood> = {
  blurb: "Ginti ki chaalon mein poora board ek rang",
  goal: "Rang chunein: upar baayen kone wala hissa us rang ka ho jata hai. Ginti ki chaalon mein poora board ek rang karein.",
  rules: [
    "Upar baayen kone se jura hua hissa aap ka hai.",
    "Neeche se rang chunein: aap ka hissa us rang ka ho jata hai aur saath lage usi rang ke khane jur jate hain.",
    "Chaalon ki ginti mehdood hai. Us se pehle poora board ek rang karein.",
  ],
  how: "Neeche rang ke button dabayein. Tip: wo rang chunein jo sab se zyada khane jore.",
  init: (p) => ({ grid: [...p.grid], picks: [] }),
  Board: ({ puzzle: p, state: s, set }) => {
    const left = p.moves - s.picks.length;
    const done = s.grid.every((c) => c === s.grid[0]);
    // the player's area, for a subtle outline
    const mine = new Set([0]);
    const todo = [0];
    while (todo.length) {
      const i = todo.pop()!;
      for (const j of neighbours(p.n, i)) if (!mine.has(j) && s.grid[j] === s.grid[0]) { mine.add(j); todo.push(j); }
    }
    return (
      <div className="pz-stack">
        <Grid n={p.n} cls="flood" cell={(i) => ({ cls: mine.has(i) ? "mine" : "", style: { background: PAINT[s.grid[i]] } })} />
        <div className="pz-flood-bar">
          <span className={`pz-moves ${left <= 0 && !done ? "bad" : ""}`}>
            Chaalein <b>{left}</b>/{p.moves}
          </span>
          <div className="pz-colors">
            {Array.from({ length: p.colors }, (_, c) => (
              <button
                key={c}
                data-cell={`color-${c}`}
                style={{ background: PAINT[c] }}
                disabled={!set || left <= 0 || done || c === s.grid[0]}
                onClick={() => set?.({ grid: floodPaint(p.n, s.grid, c), picks: [...s.picks, c] })}
                aria-label={`Rang ${c + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
  attempt: (_, s) => (s.picks.length && s.grid.every((c) => c === s.grid[0]) ? s.picks : null),
  shown: (p, sol) => ({ grid: sol.reduce((g, c) => floodPaint(p.n, g, c), p.grid), picks: sol }),
  demo: (p, sol) => {
    let grid = p.grid;
    return sol.map((c, k) => {
      grid = floodPaint(p.n, grid, c);
      return {
        state: { grid, picks: sol.slice(0, k + 1) },
        at: `color-${c}`,
        say: k === 0 ? "Rang chuna — kone ka hissa us rang ka ho gaya aur saath ke khane jur gaye." : k === sol.length - 1 ? `${p.moves} chaalon mein poora board ek rang — hal!` : undefined,
      };
    });
  },
};

// ---------- Hisaab Jor (target number) ----------

type Target = { list: number[]; ops: number[]; pick: number | null; op: number | null; log: string[]; err?: boolean };

const apply = (s: Target, i: number, op: number, j: number): Target | null => {
  const list = targetStep(s.list, i, op, j);
  if (!list) return null;
  return { list, ops: [...s.ops, i, op, j], pick: list.length - 1, op: null, log: [...s.log, `${s.list[i]} ${OPS[op]} ${s.list[j]} = ${list[list.length - 1]}`] };
};

export const target: PuzzleDef<"target", Target> = {
  blurb: "Numbers jor tor kar target banayein",
  goal: "Numbers ko + − × ÷ se jor kar target number banayein. Har number ek dafa.",
  rules: [
    "Do numbers aur ek nishan (+ − × ÷) chunein — dono ki jagah un ka jawab aa jata hai.",
    "Har number sirf ek dafa istemal hota hai. Saare istemal karna zaroori nahi.",
    "Jawab hamesha poora aur musbat (positive) ho: 7 − 9 ya 7 ÷ 2 nahi chalega.",
    "Target number ban jaye to puzzle hal.",
  ],
  how: "Number tap → nishan tap → doosra number tap. Ghalti ho to 'Wapas' dabayein.",
  init: (p) => ({ list: [...p.nums], ops: [], pick: null, op: null, log: [] }),
  Board: ({ puzzle: p, state: s, set }) => {
    const reached = s.list.includes(p.target);
    const tapNum = (i: number) => {
      if (!set) return;
      if (s.pick === null || s.op === null) return set({ ...s, pick: s.pick === i ? null : i, err: false });
      if (i === s.pick) return set({ ...s, op: null, err: false });
      set(apply(s, s.pick, s.op, i) ?? { ...s, err: true });
    };
    return (
      <div className="pz-target">
        <div className={`pz-goal ${reached ? "hit" : ""}`}>
          <TargetIcon size={20} /> Target <b>{p.target}</b>
        </div>
        <div className="pz-nums">
          {s.list.map((v, i) => (
            <button key={`${s.ops.length}-${i}`} data-cell={`num-${i}`} className={`${s.pick === i ? "sel" : ""} ${v === p.target ? "hit" : ""}`} disabled={!set} onClick={() => tapNum(i)}>
              {v}
            </button>
          ))}
        </div>
        <div className="pz-ops">
          {OPS.map((o, k) => (
            <button key={o} data-cell={`op-${k}`} className={s.op === k ? "sel" : ""} disabled={!set || s.pick === null} onClick={() => set?.({ ...s, op: s.op === k ? null : k, err: false })}>
              {o}
            </button>
          ))}
        </div>
        <ol className={`pz-log ${s.err ? "err" : ""}`}>
          {s.log.map((line) => <li key={line}>{line}</li>)}
          {s.err && <li className="bad">Ye nahi ho sakta — jawab poora aur musbat ho</li>}
        </ol>
      </div>
    );
  },
  attempt: (p, s) => (s.ops.length && s.list.includes(p.target) ? s.ops : null),
  shown: (p, sol) => {
    let s = target.init(p);
    for (let k = 0; k < sol.length; k += 3) s = apply(s, sol[k], sol[k + 1], sol[k + 2]) ?? s;
    return { ...s, pick: null };
  },
  demo: (p, sol) => {
    const steps: Step<Target>[] = [];
    let s = target.init(p);
    for (let k = 0; k < sol.length; k += 3) {
      const [i, op, j] = sol.slice(k, k + 3);
      s = { ...s, pick: i, op: null };
      steps.push({ state: s, at: `num-${i}`, say: k === 0 ? "Pehla number tap karein…" : "Agla number…" });
      s = { ...s, op };
      steps.push({ state: s, at: `op-${op}`, say: k === 0 ? "…phir nishan…" : undefined });
      s = apply(s, i, op, j)!;
      const last = k + 3 >= sol.length;
      steps.push({ state: s, at: `num-${j}`, say: last ? `${p.target} ban gaya — hal!` : k === 0 ? "…phir doosra number. Dono ki jagah jawab aa gaya." : undefined });
    }
    return steps;
  },
};

// ---------- Gend Tarteeb (ball sort) ----------

type Balls = { tubes: number[][]; sel: number | null; moves: number[]; err?: boolean };

export const balls: PuzzleDef<"balls", Balls> = {
  blurb: "Har nali mein ek rang ki gendein",
  goal: "Gendein nali se nali mein daal kar har nali mein ek hi rang ki gendein jama karein.",
  rules: [
    "Sirf sab se upar wali gend utha sakte hain.",
    "Gend khaali nali mein, ya usi rang ki gend ke upar hi rakh sakte hain.",
    "Ek nali mein zyada se zyada 4 gendein.",
    "Har nali mein ek hi rang (ya khaali) ho jaye to hal.",
  ],
  how: "Pehle nali tap karein (upar wali gend uth jati hai), phir jis nali mein daalni hai us par tap.",
  init: (p) => ({ tubes: p.tubes.map((t) => [...t]), sel: null, moves: [] }),
  Board: ({ puzzle: p, state: s, set }) => {
    const tap = (k: number) => {
      if (!set) return;
      if (s.sel === null) return s.tubes[k].length && set({ ...s, sel: k, err: false });
      if (s.sel === k) return set({ ...s, sel: null });
      const tubes = ballsMove(s.tubes, p.cap, s.sel, k);
      if (tubes) set({ tubes, sel: null, moves: [...s.moves, s.sel, k] });
      else set({ ...s, sel: s.tubes[k].length ? k : s.sel, err: true });
    };
    return (
      <div className={`pz-tubes ${s.err ? "err" : ""}`} style={{ gridTemplateColumns: `repeat(${Math.min(s.tubes.length, 6)}, 1fr)` }}>
        {s.tubes.map((t, k) => {
          const full = t.length === p.cap && t.every((x) => x === t[0]);
          return (
            <button key={k} data-cell={`tube-${k}`} className={`pz-tube ${s.sel === k ? "sel" : ""} ${full ? "full" : ""}`} disabled={!set} onClick={() => tap(k)}>
              {t.map((c, j) => (
                <i key={j} className={s.sel === k && j === t.length - 1 ? "up" : ""} style={{ background: PAINT[c], bottom: `${(j / p.cap) * 100}%`, height: `${100 / p.cap}%` }} />
              ))}
            </button>
          );
        })}
      </div>
    );
  },
  attempt: (p, s) => (s.moves.length && ballsDone(s.tubes, p.cap) ? s.moves : null),
  shown: (p, sol) => {
    let tubes = p.tubes;
    for (let k = 0; k < sol.length; k += 2) tubes = ballsMove(tubes, p.cap, sol[k], sol[k + 1]) ?? tubes;
    return { tubes, sel: null, moves: sol };
  },
  demo: (p, sol) => {
    const steps: Step<Balls>[] = [];
    let tubes = p.tubes;
    for (let k = 0; k < sol.length; k += 2) {
      const [from, to] = [sol[k], sol[k + 1]];
      steps.push({ state: { tubes, sel: from, moves: sol.slice(0, k) }, at: `tube-${from}`, say: k === 0 ? "Nali tap: upar wali gend uth gayi…" : undefined });
      tubes = ballsMove(tubes, p.cap, from, to)!;
      const last = k + 2 >= sol.length;
      steps.push({
        state: { tubes, sel: null, moves: sol.slice(0, k + 2) },
        at: `tube-${to}`,
        say: last ? "Har nali mein ek rang — hal!" : k === 0 ? "…khaali nali ya usi rang ke upar rakh di." : undefined,
      });
    }
    return steps;
  },
};
