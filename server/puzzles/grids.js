// Grid puzzles: fill or mark cells. Each maker returns { puzzle, solution } (see lib/puzzle-rules.js for the rules).
import { AKARI_WALL, akariRays, lightsAfter, nonogramClues, skylineClues, sunmoonOk, touches, visible } from "../../lib/puzzle-rules.js";
import { breathe, latinSolve, neighbours, pick, rand, range, shuffle, thinGivens } from "./util.js";

const zeros = (n) => new Array(n * n).fill(0);
const randomLatin = (n, box) => latinSolve(n, zeros(n), { box, random: true, limit: 1 }).first;

// ---------- crowns ----------

function crownsCount(n, regions, limit = 2) {
  let count = 0;
  const cols = new Array(n).fill(-1);
  const usedCol = new Array(n).fill(false);
  const usedReg = new Array(n).fill(false);
  (function place(r) {
    if (count >= limit) return;
    if (r === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      const reg = regions[r * n + c];
      if (usedCol[c] || usedReg[reg] || (r > 0 && Math.abs(cols[r - 1] - c) < 2)) continue;
      usedCol[c] = usedReg[reg] = true;
      cols[r] = c;
      place(r + 1);
      usedCol[c] = usedReg[reg] = false;
    }
  })(0);
  return count;
}

// Tries random layouts until exactly one answer fits. Yields every 25 tries so a slow 7x7 never stalls matches.
export async function crowns(n) {
  for (let attempt = 0; attempt < 5000; attempt++) {
    if (attempt % 25 === 24) await breathe();
    const cols = [];
    const ok = (function place(r) {
      if (r === n) return true;
      for (const c of shuffle(range(n))) {
        if (cols.includes(c) || (r > 0 && Math.abs(cols[r - 1] - c) < 2)) continue;
        cols.push(c);
        if (place(r + 1)) return true;
        cols.pop();
      }
      return false;
    })(0);
    if (!ok) continue;
    // colour regions grow out from each crown
    const regions = new Array(n * n).fill(-1);
    cols.forEach((c, r) => (regions[r * n + c] = r));
    let left = n * n - n;
    while (left > 0) {
      const i = rand(n * n);
      if (regions[i] !== -1) continue;
      const near = neighbours(n, i).filter((j) => regions[j] !== -1);
      if (!near.length) continue;
      regions[i] = regions[pick(near)];
      left--;
    }
    if (crownsCount(n, regions) === 1) return { puzzle: { kind: "crowns", n, regions }, solution: cols.map((c, r) => r * n + c) };
  }
  return null;
}

// ---------- sun & moon ----------

function sunmoonCount(n, givens, hints, limit = 2) {
  const g = [...givens];
  const empty = range(n * n).filter((i) => g[i] === -1);
  let count = 0;
  (function fill(k) {
    if (count >= limit) return;
    if (k === empty.length) { count++; return; }
    const i = empty[k];
    for (const v of [0, 1]) {
      g[i] = v;
      if (sunmoonOk(n, g, i, hints)) fill(k + 1);
    }
    g[i] = -1;
  })(0);
  return count;
}

export async function sunmoon(n, hintCount) {
  const g = new Array(n * n).fill(-1);
  (function fill(i) {
    if (i === n * n) return true;
    for (const v of shuffle([0, 1])) {
      g[i] = v;
      if (sunmoonOk(n, g, i, []) && fill(i + 1)) return true;
    }
    g[i] = -1;
    return false;
  })(0);
  const solution = [...g];
  // a few "=" / "x" signs between neighbours, then remove givens while the answer stays unique
  const pairs = [];
  for (let i = 0; i < n * n; i++) for (const j of neighbours(n, i)) if (j > i) pairs.push([i, j]);
  const hints = shuffle(pairs).slice(0, hintCount).map(([a, b]) => [a, b, solution[a] === solution[b]]);
  const givens = [...solution];
  for (const [k, i] of shuffle(range(n * n)).entries()) {
    if (k % 4 === 3) await breathe();
    const keep = givens[i];
    givens[i] = -1;
    if (sunmoonCount(n, givens, hints) !== 1) givens[i] = keep;
  }
  return { puzzle: { kind: "sunmoon", n, givens, hints }, solution };
}

// ---------- sudoku ----------

export async function sudoku(n, box, extra) {
  const solution = randomLatin(n, box);
  const givens = await thinGivens(n, solution, (g) => latinSolve(n, g, { box }).count === 1, extra);
  return { puzzle: { kind: "sudoku", n, box, givens }, solution };
}

// ---------- futoshiki: a number grid with "<" signs between some neighbours ----------

export async function futoshiki(n, signCount, extra) {
  const solution = randomLatin(n);
  const pairs = [];
  for (let i = 0; i < n * n; i++) for (const j of neighbours(n, i)) if (j > i) pairs.push(solution[i] < solution[j] ? [i, j] : [j, i]);
  const signs = shuffle(pairs).slice(0, signCount);
  const ok = (v, i) => signs.every(([a, b]) => (a !== i && b !== i) || !v[a] || !v[b] || v[a] < v[b]);
  const givens = await thinGivens(n, solution, (g) => latinSolve(n, g, { ok }).count === 1, extra);
  return { puzzle: { kind: "futoshiki", n, givens, signs }, solution };
}

// ---------- skyscrapers: numbers are building heights; clues say how many you see from that side ----------

const permsOf = (list) => (list.length <= 1 ? [list] : list.flatMap((x, i) => permsOf([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [x, ...p])));

// Counts answers (up to 2) row by row: each row is a ready-made ordering that already fits its left/right clues,
// and the columns are checked from the top as rows go down. Fast enough for 5x5 in a few milliseconds.
function skyscraperCount(n, givens, clues) {
  const rowOptions = range(n).map((r) =>
    permsOf(range(n, 1)).filter(
      (p) =>
        (!clues.left[r] || visible(p) === clues.left[r]) &&
        (!clues.right[r] || visible([...p].reverse()) === clues.right[r]) &&
        p.every((v, c) => !givens[r * n + c] || givens[r * n + c] === v),
    ),
  );
  const rows = [];
  const used = new Array(n).fill(0), tallest = new Array(n).fill(0), seen = new Array(n).fill(0);
  let count = 0;
  (function place(r) {
    if (count >= 2) return;
    if (r === n) {
      if (range(n).every((c) => !clues.bottom[c] || visible(rows.map((row) => row[c]).reverse()) === clues.bottom[c])) count++;
      return;
    }
    for (const p of rowOptions[r]) {
      let fits = true;
      for (let c = 0; c < n && fits; c++) {
        const v = p[c], top = clues.top[c];
        const nowSeen = seen[c] + (v > tallest[c] ? 1 : 0);
        fits = !(used[c] & (1 << v)) && (!top || (nowSeen <= top && (v !== n || nowSeen === top)));
      }
      if (!fits) continue;
      const saved = [...tallest], savedSeen = [...seen];
      p.forEach((v, c) => { used[c] |= 1 << v; if (v > tallest[c]) { tallest[c] = v; seen[c]++; } });
      rows.push(p);
      place(r + 1);
      rows.pop();
      p.forEach((v, c) => (used[c] &= ~(1 << v)));
      tallest.splice(0, n, ...saved);
      seen.splice(0, n, ...savedSeen);
    }
  })(0);
  return count;
}

// Async: yields between uniqueness checks, so a 5x5 (up to ~0.4s of work) never stalls live matches.
export async function skyscraper(n, extraClues) {
  const solution = randomLatin(n);
  const all = skylineClues(n, solution);
  const clues = { top: [...all.top], bottom: [...all.bottom], left: [...all.left], right: [...all.right] };
  const givens = zeros(n);
  const unique = () => skyscraperCount(n, givens, clues) === 1;
  // all clues nearly always pin one answer; if not, add givens until they do
  while (!unique()) {
    const i = pick(range(n * n).filter((k) => !givens[k]));
    givens[i] = solution[i];
  }
  const removed = [];
  for (const [side, k] of shuffle(["top", "bottom", "left", "right"].flatMap((s) => range(n).map((k) => [s, k])))) {
    await breathe();
    const keep = clues[side][k];
    clues[side][k] = 0;
    if (unique()) removed.push([side, k, keep]);
    else clues[side][k] = keep;
  }
  for (const [side, k, keep] of removed.slice(0, extraClues)) clues[side][k] = keep;
  return { puzzle: { kind: "skyscraper", n, givens, ...clues }, solution };
}

// ---------- lights off ----------

export function lights(n, taps) {
  for (;;) {
    const solution = shuffle(range(n * n)).slice(0, taps);
    const on = lightsAfter(n, zeros(n), solution);
    if (on.filter(Boolean).length >= Math.max(3, taps)) return { puzzle: { kind: "lights", n, on }, solution };
  }
}

// ---------- nonogram: a hidden picture, with the runs of filled cells given for each row and column ----------

function lineOptions(n, clue) {
  const out = [];
  if (clue.length === 1 && clue[0] === 0) return [new Array(n).fill(0)];
  (function place(k, from, acc) {
    if (k === clue.length) { out.push([...acc, ...new Array(n - acc.length).fill(0)]); return; }
    const rest = clue.slice(k + 1).reduce((s, x) => s + x + 1, 0);
    for (let at = from; at + clue[k] + rest <= n; at++) {
      const next = [...acc, ...new Array(at - acc.length).fill(0), ...new Array(clue[k]).fill(1)];
      if (k < clue.length - 1) next.push(0);
      place(k + 1, next.length, next);
    }
  })(0, 0, []);
  return out;
}

// true when row-by-row logic alone fills the whole picture (so the picture is the only answer)
function lineLogicSolves(n, rows, cols) {
  const g = new Array(n * n).fill(-1);
  const lines = [
    ...rows.map((clue, r) => ({ cells: range(n).map((c) => r * n + c), opts: lineOptions(n, clue) })),
    ...cols.map((clue, c) => ({ cells: range(n).map((r) => r * n + c), opts: lineOptions(n, clue) })),
  ];
  for (let changed = true; changed; ) {
    changed = false;
    for (const line of lines) {
      line.opts = line.opts.filter((o) => o.every((v, k) => g[line.cells[k]] === -1 || g[line.cells[k]] === v));
      if (!line.opts.length) return false;
      line.cells.forEach((cell, k) => {
        if (g[cell] !== -1) return;
        const v = line.opts[0][k];
        if (line.opts.every((o) => o[k] === v)) { g[cell] = v; changed = true; }
      });
    }
  }
  return g.every((v) => v !== -1);
}

export function nonogram(n) {
  for (let attempt = 0; ; attempt++) {
    const filled = new Set(range(n * n).filter(() => rand(100) < 58));
    const { rows, cols } = nonogramClues(n, filled);
    if (attempt < 400 && !lineLogicSolves(n, rows, cols)) continue;
    return { puzzle: { kind: "nonogram", n, rows, cols }, solution: [...filled].sort((a, b) => a - b) };
  }
}

// ---------- hitori: shade the repeats ----------

export function hitori(n) {
  const nums = randomLatin(n);
  const dark = new Set();
  const lightConnected = () => {
    const light = range(n * n).filter((i) => !dark.has(i));
    const seen = new Set([light[0]]);
    const todo = [light[0]];
    while (todo.length) for (const j of neighbours(n, todo.pop())) if (!dark.has(j) && !seen.has(j)) { seen.add(j); todo.push(j); }
    return seen.size === light.length;
  };
  const want = Math.round(n * n * 0.27);
  for (const i of shuffle(range(n * n))) {
    if (dark.size >= want) break;
    if (neighbours(n, i).some((j) => dark.has(j))) continue;
    dark.add(i);
    if (!lightConnected()) dark.delete(i);
  }
  // each shaded cell takes a number that repeats one already in its row or column
  for (const i of dark) {
    const r = Math.floor(i / n), c = i % n;
    const same = range(n).flatMap((k) => [r * n + k, k * n + c]).filter((j) => j !== i && !dark.has(j));
    nums[i] = nums[pick(same)];
  }
  return { puzzle: { kind: "hitori", n, nums }, solution: [...dark].sort((a, b) => a - b) };
}

// ---------- tents beside trees ----------

export function tents(n) {
  for (;;) {
    const tentSet = new Set(), trees = [];
    const want = Math.round((n * n) / 5.2);
    for (const i of shuffle(range(n * n))) {
      if (tentSet.size >= want) break;
      if (trees.includes(i) || [...tentSet].some((t) => touches(n, t, i))) continue;
      const spots = neighbours(n, i).filter((j) => !tentSet.has(j) && !trees.includes(j));
      if (!spots.length) continue;
      tentSet.add(i);
      trees.push(pick(spots));
    }
    if (tentSet.size < want - 1) continue;
    const solution = [...tentSet].sort((a, b) => a - b);
    const rowCount = range(n).map((r) => solution.filter((t) => Math.floor(t / n) === r).length);
    const colCount = range(n).map((c) => solution.filter((t) => t % n === c).length);
    return { puzzle: { kind: "tents", n, trees: trees.sort((a, b) => a - b), rowCount, colCount }, solution };
  }
}

// ---------- akari: light every white cell with bulbs ----------

export function akari(n) {
  const cells = new Array(n * n).fill(-1);
  // walls in a mirror pattern (180° turn), which reads as a designed board
  for (let k = 0; k < Math.round(n * n * 0.1); k++) {
    const i = rand(n * n);
    cells[i] = cells[n * n - 1 - i] = AKARI_WALL;
  }
  const bulbs = new Set(), lit = new Set();
  for (const i of shuffle(range(n * n))) {
    if (cells[i] !== -1 || lit.has(i)) continue;
    bulbs.add(i);
    lit.add(i);
    for (const c of akariRays(n, cells, i)) lit.add(c);
  }
  // most walls show how many bulbs touch them
  for (let i = 0; i < n * n; i++) {
    if (cells[i] === AKARI_WALL && rand(100) < 75) cells[i] = neighbours(n, i).filter((j) => bulbs.has(j)).length;
  }
  return { puzzle: { kind: "akari", n, cells }, solution: [...bulbs].sort((a, b) => a - b) };
}
