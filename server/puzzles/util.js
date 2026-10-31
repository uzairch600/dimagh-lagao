import crypto from "node:crypto";

export { neighbours } from "../../lib/puzzle-rules.js";

export const rand = (n) => crypto.randomInt(n);
export const pick = (arr) => arr[rand(arr.length)];
export const range = (n, from = 0) => Array.from({ length: n }, (_, k) => k + from);
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// lets live matches run between attempts of a slow generator
export const breathe = () => new Promise((r) => setImmediate(r));

const bits = (m) => {
  let c = 0;
  for (; m; m &= m - 1) c++;
  return c;
};

// Fills or counts the solutions (up to `limit`) of an n x n number grid: every row and column holds 1..n once,
// optionally every box too (box = [rows, cols]). `ok(v, i)` adds the puzzle's own rule after cell i is filled.
// Picks the cell with the fewest options first, so 7x7 grids solve in milliseconds.
export function latinSolve(n, givens, { box, ok, limit = 2, random = false } = {}) {
  const v = [...givens];
  const full = (1 << (n + 1)) - 2;
  const rowM = new Array(n).fill(0), colM = new Array(n).fill(0), boxM = new Array(n).fill(0);
  const boxOf = (i) => (box ? Math.floor(Math.floor(i / n) / box[0]) * (n / box[1]) + Math.floor((i % n) / box[1]) : 0);
  for (let i = 0; i < n * n; i++) {
    if (!v[i]) continue;
    const b = 1 << v[i], r = Math.floor(i / n), c = i % n;
    if (rowM[r] & b || colM[c] & b || (box && boxM[boxOf(i)] & b)) return { count: 0, first: null };
    rowM[r] |= b; colM[c] |= b; if (box) boxM[boxOf(i)] |= b;
  }
  let count = 0, first = null, nodes = 0;
  (function fill() {
    if (count >= limit || ++nodes > 200000) return;
    let best = -1, bestMask = 0, fewest = 99;
    for (let i = 0; i < n * n; i++) {
      if (v[i]) continue;
      const mask = full & ~(rowM[Math.floor(i / n)] | colM[i % n] | (box ? boxM[boxOf(i)] : 0));
      const k = bits(mask);
      if (!k) return;
      if (k < fewest) { fewest = k; best = i; bestMask = mask; }
    }
    if (best === -1) {
      count++;
      if (!first) first = [...v];
      return;
    }
    const r = Math.floor(best / n), c = best % n, bx = boxOf(best);
    let digits = range(n, 1).filter((d) => bestMask & (1 << d));
    if (random) digits = shuffle(digits);
    for (const d of digits) {
      const b = 1 << d;
      v[best] = d; rowM[r] |= b; colM[c] |= b; if (box) boxM[bx] |= b;
      if (!ok || ok(v, best)) fill();
      v[best] = 0; rowM[r] &= ~b; colM[c] &= ~b; if (box) boxM[bx] &= ~b;
      if (count >= limit) return;
    }
  })();
  // a search cut short can't promise a unique answer
  if (nodes > 200000 && count < limit) count = limit;
  return { count, first };
}

// Removes givens one by one (random order) while the puzzle keeps exactly one answer. Yields every few checks so a
// 9x9 never stalls live matches.
export async function thinGivens(n, solution, unique, keepExtra = 0) {
  const givens = [...solution];
  const removed = [];
  for (const [k, i] of shuffle(range(n * n)).entries()) {
    if (k % 6 === 5) await breathe();
    givens[i] = 0;
    if (unique(givens)) removed.push(i);
    else givens[i] = solution[i];
  }
  // easier levels hand back a few of the removed numbers
  for (const i of shuffle(removed).slice(0, keepExtra)) givens[i] = solution[i];
  return givens;
}
