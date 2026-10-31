// Puzzle games for the "Puzzles" section. Each puzzle is generated on the server and both players get the same one.
// The server checks a submitted solution against the puzzle's rules, so any valid solution counts.
//
//   crowns  - coloured regions; one crown per row, column and region; crowns never touch, not even diagonally
//   sunmoon - fill the grid with suns and moons; each row/column half and half, never three alike in a line;
//             "=" between two cells means same, "x" means different
//   path    - one line from 1 through every number in order, visiting every cell exactly once
//   maze    - find the way from the start to the exit
import crypto from "node:crypto";

export const PUZZLE_KINDS = ["crowns", "sunmoon", "path", "maze"];
export const PUZZLES_PER_MATCH = 3;

const rand = (n) => crypto.randomInt(n);
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const neighbours = (n, i) => {
  const r = Math.floor(i / n), c = i % n, out = [];
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  return out;
};
const isList = (x, len) => Array.isArray(x) && (len == null || x.length === len) && x.every((v) => Number.isInteger(v));

// ---------- crowns ----------

function crownsSolutions(n, regions, limit = 2) {
  let count = 0;
  let first = null;
  const cols = new Array(n).fill(-1);
  const usedCol = new Array(n).fill(false);
  const usedReg = new Array(n).fill(false);
  (function place(r) {
    if (count >= limit) return;
    if (r === n) {
      if (!first) first = [...cols];
      count++;
      return;
    }
    for (let c = 0; c < n; c++) {
      const reg = regions[r * n + c];
      if (usedCol[c] || usedReg[reg] || (r > 0 && Math.abs(cols[r - 1] - c) < 2)) continue;
      usedCol[c] = usedReg[reg] = true;
      cols[r] = c;
      place(r + 1);
      usedCol[c] = usedReg[reg] = false;
    }
  })(0);
  return { count, first };
}

// Tries random layouts until exactly one solution fits. Yields to the event loop every 25 tries so a
// slow 7x7 search never stalls live matches.
async function crownsPuzzle(n) {
  for (let attempt = 0; attempt < 5000; attempt++) {
    if (attempt % 25 === 24) await new Promise((r) => setImmediate(r));
    // crowns: one per row and column, never touching
    const cols = [];
    const ok = (function place(r) {
      if (r === n) return true;
      for (const c of shuffle([...Array(n).keys()])) {
        if (cols.includes(c) || (r > 0 && Math.abs(cols[r - 1] - c) < 2)) continue;
        cols.push(c);
        if (place(r + 1)) return true;
        cols.pop();
      }
      return false;
    })(0);
    if (!ok) continue;
    // regions grow out from each crown
    const regions = new Array(n * n).fill(-1);
    cols.forEach((c, r) => (regions[r * n + c] = r));
    let left = n * n - n;
    while (left > 0) {
      const i = rand(n * n);
      if (regions[i] !== -1) continue;
      const near = neighbours(n, i).filter((j) => regions[j] !== -1);
      if (!near.length) continue;
      regions[i] = regions[near[rand(near.length)]];
      left--;
    }
    if (crownsSolutions(n, regions).count === 1) {
      const solution = cols.map((c, r) => r * n + c);
      return { puzzle: { kind: "crowns", n, regions }, solution, check: (s) => checkCrowns(n, regions, s) };
    }
  }
  return null;
}

function checkCrowns(n, regions, s) {
  if (!isList(s, n) || new Set(s).size !== n || s.some((i) => i < 0 || i >= n * n)) return false;
  const rows = new Set(s.map((i) => Math.floor(i / n)));
  const cols = new Set(s.map((i) => i % n));
  const regs = new Set(s.map((i) => regions[i]));
  if (rows.size !== n || cols.size !== n || regs.size !== n) return false;
  for (const a of s) for (const b of s) {
    if (a === b) continue;
    if (Math.abs(Math.floor(a / n) - Math.floor(b / n)) <= 1 && Math.abs((a % n) - (b % n)) <= 1) return false;
  }
  return true;
}

// ---------- sun & moon ----------

// grid values: 0 = sun, 1 = moon, -1 = empty. hints: [a, b, same]
function sunmoonOk(n, g, i, hints) {
  const r = Math.floor(i / n), c = i % n, v = g[i];
  const row = (k) => g[r * n + k], col = (k) => g[k * n + c];
  for (const line of [row, col]) {
    let mine = 0;
    for (let k = 0; k < n; k++) if (line(k) === v) mine++;
    if (mine > n / 2) return false;
    for (let k = 0; k + 2 < n; k++) if (line(k) !== -1 && line(k) === line(k + 1) && line(k) === line(k + 2)) return false;
  }
  for (const [a, b, same] of hints) {
    if ((a === i || b === i) && g[a] !== -1 && g[b] !== -1 && (g[a] === g[b]) !== same) return false;
  }
  return true;
}

function sunmoonCount(n, givens, hints, limit = 2) {
  const g = [...givens];
  const empty = g.map((v, i) => (v === -1 ? i : -1)).filter((i) => i >= 0);
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

function sunmoonPuzzle(level) {
  const n = 6;
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
  // a few "=" / "x" hints between neighbours, then remove givens while the answer stays unique
  const pairs = [];
  for (let i = 0; i < n * n; i++) for (const j of neighbours(n, i)) if (j > i) pairs.push([i, j]);
  const hints = shuffle(pairs).slice(0, [4, 6, 8][level] ?? 6).map(([a, b]) => [a, b, solution[a] === solution[b]]);
  const givens = [...solution];
  for (const i of shuffle([...Array(n * n).keys()])) {
    const keep = givens[i];
    givens[i] = -1;
    if (sunmoonCount(n, givens, hints) !== 1) givens[i] = keep;
  }
  return {
    puzzle: { kind: "sunmoon", n, givens, hints },
    solution,
    check: (s) => checkSunmoon(n, givens, hints, s),
  };
}

function checkSunmoon(n, givens, hints, s) {
  if (!isList(s, n * n) || s.some((v) => v !== 0 && v !== 1)) return false;
  if (givens.some((v, i) => v !== -1 && v !== s[i])) return false;
  for (let i = 0; i < n * n; i++) if (!sunmoonOk(n, s, i, hints)) return false;
  return true;
}

// ---------- number path ----------

// A random path through every cell: start with a snake and apply many "backbite" moves.
function hamiltonPath(n) {
  let path = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) path.push(r * n + (r % 2 ? n - 1 - c : c));
  for (let step = 0; step < n * n * 40; step++) {
    if (rand(2)) path.reverse();
    const end = path[path.length - 1];
    const options = neighbours(n, end).filter((x) => x !== path[path.length - 2]);
    const x = options[rand(options.length)];
    const i = path.indexOf(x);
    path = [...path.slice(0, i + 1), ...path.slice(i + 1).reverse()];
  }
  return path;
}

function pathPuzzle(n) {
  const path = hamiltonPath(n);
  const count = n + 2;
  const marks = new Set([0, path.length - 1]);
  while (marks.size < count) marks.add(1 + rand(path.length - 2));
  const numbers = [...marks].sort((a, b) => a - b).map((pos, k) => [path[pos], k + 1]);
  return { puzzle: { kind: "path", n, numbers }, solution: path, check: (s) => checkPath(n, numbers, s) };
}

function checkPath(n, numbers, s) {
  if (!isList(s, n * n) || new Set(s).size !== n * n || s.some((i) => i < 0 || i >= n * n)) return false;
  for (let k = 1; k < s.length; k++) if (!neighbours(n, s[k - 1]).includes(s[k])) return false;
  const at = new Map(s.map((cell, pos) => [cell, pos]));
  const order = numbers.map(([cell]) => at.get(cell));
  if (order[0] !== 0 || order[order.length - 1] !== s.length - 1) return false;
  return order.every((p, k) => k === 0 || p > order[k - 1]);
}

// ---------- maze ----------

// open[i]: bit 1 = passage to the right, bit 2 = passage down
function mazePuzzle(n) {
  const open = new Array(n * n).fill(0);
  const seen = new Array(n * n).fill(false);
  const stack = [0];
  seen[0] = true;
  while (stack.length) {
    const i = stack[stack.length - 1];
    const next = neighbours(n, i).filter((j) => !seen[j]);
    if (!next.length) { stack.pop(); continue; }
    const j = next[rand(next.length)];
    const [a, b] = i < j ? [i, j] : [j, i];
    open[a] |= b === a + 1 ? 1 : 2;
    seen[j] = true;
    stack.push(j);
  }
  const start = 0, end = n * n - 1;
  // the one route from start to exit (shown after the round)
  const prev = new Map([[start, -1]]);
  const queue = [start];
  while (queue.length) {
    const i = queue.shift();
    for (const j of neighbours(n, i)) if (!prev.has(j) && passable(n, open, i, j)) { prev.set(j, i); queue.push(j); }
  }
  const solution = [];
  for (let i = end; i !== -1; i = prev.get(i)) solution.unshift(i);
  return { puzzle: { kind: "maze", n, open, start, end }, solution, check: (s) => checkMaze(n, open, start, end, s) };
}

function passable(n, open, i, j) {
  const [a, b] = i < j ? [i, j] : [j, i];
  return b === a + 1 && Math.floor(a / n) === Math.floor(b / n) ? (open[a] & 1) > 0 : b === a + n ? (open[a] & 2) > 0 : false;
}

function checkMaze(n, open, start, end, s) {
  if (!isList(s) || s.length < 2 || s.length > n * n * 4 || s[0] !== start || s[s.length - 1] !== end) return false;
  for (let k = 1; k < s.length; k++) if (!passable(n, open, s[k - 1], s[k])) return false;
  return true;
}

// ---------- rounds ----------

// Size and time grow over the 3 puzzles of a match.
const LEVELS = {
  crowns: [{ make: () => crownsPuzzle(6), seconds: 90 }, { make: () => crownsPuzzle(7), seconds: 120 }, { make: () => crownsPuzzle(7), seconds: 120 }],
  sunmoon: [{ make: () => sunmoonPuzzle(0), seconds: 90 }, { make: () => sunmoonPuzzle(1), seconds: 110 }, { make: () => sunmoonPuzzle(2), seconds: 130 }],
  path: [{ make: () => pathPuzzle(5), seconds: 60 }, { make: () => pathPuzzle(6), seconds: 90 }, { make: () => pathPuzzle(7), seconds: 120 }],
  maze: [{ make: () => mazePuzzle(9), seconds: 45 }, { make: () => mazePuzzle(12), seconds: 60 }, { make: () => mazePuzzle(15), seconds: 80 }],
};

export async function puzzleRound(kind, level) {
  const { make, seconds } = LEVELS[kind][Math.min(level, 2)];
  let made = await make();
  // 8x8 crowns take up to 2s to make unique, which would stall the server, so crowns stop at 7x7
  // crowns can (very rarely) fail to find a unique layout at that size: fall back one size down
  if (!made && kind === "crowns") made = await crownsPuzzle(6);
  return { id: `${kind}_${crypto.randomBytes(5).toString("hex")}`, kind, seconds, ...made };
}
