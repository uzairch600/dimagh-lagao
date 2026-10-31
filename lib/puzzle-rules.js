// Puzzle rules, shared by the server (judging a submitted solution) and the browser (live hints, practice boards).
// Plain JS so server/*.js can import it too. Cells are numbered row by row: cell i is row floor(i / n), column i % n.
// A solution is always a list of integers; what it means depends on the puzzle (see each check below).

export const isInts = (x, len) => Array.isArray(x) && (len == null || x.length === len) && x.every((v) => Number.isInteger(v));
const inGrid = (n, s) => s.every((i) => i >= 0 && i < n * n);
const distinctCells = (n, s) => isInts(s) && inGrid(n, s) && new Set(s).size === s.length;

export function neighbours(n, i) {
  const r = Math.floor(i / n), c = i % n, out = [];
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  return out;
}
export const isNext = (n, a, b) => neighbours(n, a).includes(b);
// touching, diagonals included
export const touches = (n, a, b) => a !== b && Math.abs(Math.floor(a / n) - Math.floor(b / n)) <= 1 && Math.abs((a % n) - (b % n)) <= 1;

function connected(n, cells) {
  const set = new Set(cells);
  if (!set.size) return true;
  const seen = new Set([cells[0]]);
  const todo = [cells[0]];
  while (todo.length) for (const j of neighbours(n, todo.pop())) if (set.has(j) && !seen.has(j)) { seen.add(j); todo.push(j); }
  return seen.size === set.size;
}

// ---------- crowns: one crown per row, column and colour; crowns never touch. s = the crown cells ----------
function checkCrowns({ n, regions }, s) {
  if (!distinctCells(n, s) || s.length !== n) return false;
  for (const f of [(i) => Math.floor(i / n), (i) => i % n, (i) => regions[i]]) if (new Set(s.map(f)).size !== n) return false;
  return s.every((a) => s.every((b) => !touches(n, a, b)));
}

// ---------- sun & moon. values: 0 sun, 1 moon, -1 empty. hints: [a, b, same]. s = every cell ----------
export function sunmoonOk(n, g, i, hints) {
  const r = Math.floor(i / n), c = i % n, v = g[i];
  const row = (k) => g[r * n + k], col = (k) => g[k * n + c];
  for (const line of [row, col]) {
    let mine = 0;
    for (let k = 0; k < n; k++) if (line(k) === v) mine++;
    if (mine > n / 2) return false;
    for (let k = 0; k + 2 < n; k++) if (line(k) !== -1 && line(k) === line(k + 1) && line(k) === line(k + 2)) return false;
  }
  for (const [a, b, same] of hints) if ((a === i || b === i) && g[a] !== -1 && g[b] !== -1 && (g[a] === g[b]) !== same) return false;
  return true;
}
function checkSunmoon({ n, givens, hints }, s) {
  if (!isInts(s, n * n) || s.some((v) => v !== 0 && v !== 1)) return false;
  if (givens.some((v, i) => v !== -1 && v !== s[i])) return false;
  for (let i = 0; i < n * n; i++) if (!sunmoonOk(n, s, i, hints)) return false;
  return true;
}

// ---------- lines through cells: s = the cells in order ----------
const walk = (n, s, step) => s.every((c, k) => k === 0 || step(s[k - 1], c));

function checkPath({ n, numbers }, s) {
  if (!distinctCells(n, s) || s.length !== n * n || !walk(n, s, (a, b) => isNext(n, a, b))) return false;
  const at = new Map(s.map((cell, pos) => [cell, pos]));
  const order = numbers.map(([cell]) => at.get(cell));
  return order[0] === 0 && order[order.length - 1] === s.length - 1 && order.every((p, k) => k === 0 || p > order[k - 1]);
}

// maze walls: open[i] bit 1 = passage to the right, bit 2 = passage down
export function mazeOpen(n, open, i, j) {
  const [a, b] = i < j ? [i, j] : [j, i];
  if (b === a + 1 && Math.floor(a / n) === Math.floor(b / n)) return (open[a] & 1) > 0;
  return b === a + n ? (open[a] & 2) > 0 : false;
}
function checkMaze({ n, open, start, end }, s) {
  if (!isInts(s) || !inGrid(n, s) || s.length < 2 || s.length > n * n * 4 || s[0] !== start || s[s.length - 1] !== end) return false;
  return walk(n, s, (a, b) => mazeOpen(n, open, a, b));
}

// one line from the start through every open cell
function checkOneline({ n, blocked, start }, s) {
  const shut = new Set(blocked);
  return distinctCells(n, s) && s[0] === start && s.length === n * n - shut.size && s.every((c) => !shut.has(c)) && walk(n, s, (a, b) => isNext(n, a, b));
}

// coloured pairs, each joined by its own line, every cell used. s = the lines one after another, -1 between them
export function splitLines(s) {
  const out = [[]];
  for (const v of s) v === -1 ? out.push([]) : out[out.length - 1].push(v);
  return out;
}
function checkLink({ n, ends }, s) {
  if (!isInts(s)) return false;
  const lines = splitLines(s);
  const cells = lines.flat();
  if (lines.length !== ends.length || cells.length !== n * n || !distinctCells(n, cells)) return false;
  return lines.every((line, k) => {
    const [a, b] = ends[k];
    const tips = [line[0], line[line.length - 1]];
    return line.length >= 2 && tips.includes(a) && tips.includes(b) && walk(n, line, (x, y) => isNext(n, x, y));
  });
}

// ---------- number grids: s = every cell's number, 1..n ----------
function latin(n, s) {
  if (!isInts(s, n * n) || s.some((v) => v < 1 || v > n)) return false;
  for (let k = 0; k < n; k++) {
    const row = new Set(), col = new Set();
    for (let j = 0; j < n; j++) { row.add(s[k * n + j]); col.add(s[j * n + k]); }
    if (row.size !== n || col.size !== n) return false;
  }
  return true;
}
const keepsGivens = (givens, s) => givens.every((v, i) => !v || v === s[i]);

// box: [rows, cols] of each sudoku box
export const boxOf = (n, box, i) => Math.floor(Math.floor(i / n) / box[0]) * (n / box[1]) + Math.floor((i % n) / box[1]);
function checkSudoku({ n, box, givens }, s) {
  if (!latin(n, s) || !keepsGivens(givens, s)) return false;
  const seen = new Set(s.map((v, i) => boxOf(n, box, i) * 100 + v));
  return seen.size === n * n;
}

// signs: [a, b] means value at a < value at b
function checkFutoshiki({ n, givens, signs }, s) {
  return latin(n, s) && keepsGivens(givens, s) && signs.every(([a, b]) => s[a] < s[b]);
}

// how many buildings you see looking along a line (taller ones hide the ones behind)
export function visible(line) {
  let tallest = 0, seen = 0;
  for (const h of line) if (h > tallest) { tallest = h; seen++; }
  return seen;
}
// clues: top/bottom per column, left/right per row; 0 = no clue
export function skylineClues(n, v) {
  const row = (r) => Array.from({ length: n }, (_, c) => v[r * n + c]);
  const col = (c) => Array.from({ length: n }, (_, r) => v[r * n + c]);
  const ks = [...Array(n).keys()];
  return {
    top: ks.map((c) => visible(col(c))),
    bottom: ks.map((c) => visible(col(c).reverse())),
    left: ks.map((r) => visible(row(r))),
    right: ks.map((r) => visible(row(r).reverse())),
  };
}
function checkSkyscraper(p, s) {
  if (!latin(p.n, s) || !keepsGivens(p.givens, s)) return false;
  const real = skylineClues(p.n, s);
  return ["top", "bottom", "left", "right"].every((side) => p[side].every((c, k) => !c || c === real[side][k]));
}

// ---------- shading grids ----------
// lights: a tap flips the cell and its 4 neighbours; all lights must end off. s = the taps
export function lightsAfter(n, on, taps) {
  const g = [...on];
  for (const t of taps) for (const c of [t, ...neighbours(n, t)]) g[c] ^= 1;
  return g;
}
function checkLights({ n, on }, s) {
  return isInts(s) && s.length <= 5000 && inGrid(n, s) && lightsAfter(n, on, s).every((v) => v === 0);
}

// nonogram: the clue of a line is its runs of filled cells ([0] for an empty line). s = the filled cells
export function runs(cells) {
  const out = [];
  let run = 0;
  for (const f of cells) {
    if (f) run++;
    else if (run) { out.push(run); run = 0; }
  }
  if (run) out.push(run);
  return out.length ? out : [0];
}
export function nonogramClues(n, filled) {
  const ks = [...Array(n).keys()];
  return {
    rows: ks.map((r) => runs(ks.map((c) => filled.has(r * n + c)))),
    cols: ks.map((c) => runs(ks.map((r) => filled.has(r * n + c)))),
  };
}
function checkNonogram({ n, rows, cols }, s) {
  if (!distinctCells(n, s)) return false;
  const got = nonogramClues(n, new Set(s));
  return JSON.stringify(got.rows) === JSON.stringify(rows) && JSON.stringify(got.cols) === JSON.stringify(cols);
}

// hitori: shade cells so no number repeats in a row or column among the rest; shaded cells never side by side;
// the unshaded cells stay one connected area. s = the shaded cells
function checkHitori({ n, nums }, s) {
  if (!distinctCells(n, s)) return false;
  const dark = new Set(s);
  if (s.some((a) => neighbours(n, a).some((b) => dark.has(b)))) return false;
  for (let k = 0; k < n; k++) {
    const row = new Set(), col = new Set();
    for (let j = 0; j < n; j++) {
      const a = k * n + j, b = j * n + k;
      if (!dark.has(a)) { if (row.has(nums[a])) return false; row.add(nums[a]); }
      if (!dark.has(b)) { if (col.has(nums[b])) return false; col.add(nums[b]); }
    }
  }
  return connected(n, [...Array(n * n).keys()].filter((i) => !dark.has(i)));
}

// tents: every tree gets its own tent beside it (not diagonal); tents never touch, not even diagonally;
// row and column counts match. s = the tent cells
function checkTents({ n, trees, rowCount, colCount }, s) {
  if (!distinctCells(n, s) || s.length !== trees.length) return false;
  const treeSet = new Set(trees);
  if (s.some((t) => treeSet.has(t))) return false;
  if (s.some((a) => s.some((b) => touches(n, a, b)))) return false;
  for (let k = 0; k < n; k++) {
    if (s.filter((t) => Math.floor(t / n) === k).length !== rowCount[k]) return false;
    if (s.filter((t) => t % n === k).length !== colCount[k]) return false;
  }
  // every tree paired with a different tent next to it (bipartite matching)
  const tentOf = new Map();
  const tryTree = (tree, seen) => {
    for (const t of neighbours(n, tree)) {
      if (!s.includes(t) || seen.has(t)) continue;
      seen.add(t);
      if (!tentOf.has(t) || tryTree(tentOf.get(t), seen)) { tentOf.set(t, tree); return true; }
    }
    return false;
  };
  return trees.every((tree) => tryTree(tree, new Set()));
}

// akari: cells[i] -1 = open, 0..4 = black wall with a number, 5 = plain black wall. A bulb lights its row and
// column up to the next wall. Every open cell lit, no bulb lights another, numbers count the bulbs beside them.
export const AKARI_WALL = 5;
export function akariRays(n, cells, i) {
  const out = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    let r = Math.floor(i / n) + dr, c = (i % n) + dc;
    while (r >= 0 && r < n && c >= 0 && c < n && cells[r * n + c] === -1) { out.push(r * n + c); r += dr; c += dc; }
  }
  return out;
}
function checkAkari({ n, cells }, s) {
  if (!distinctCells(n, s) || s.some((i) => cells[i] !== -1)) return false;
  const bulbs = new Set(s);
  const lit = new Set(s);
  for (const b of s) for (const c of akariRays(n, cells, b)) { if (bulbs.has(c)) return false; lit.add(c); }
  return cells.every((v, i) => (v === -1 ? lit.has(i) : v === AKARI_WALL || neighbours(n, i).filter((j) => bulbs.has(j)).length === v));
}

// ---------- moves ----------
// sliding tiles: tiles[i] is the number on cell i, 0 = the gap. s = the cells the gap moves into, in order
export const slideDone = (tiles) => tiles.every((t, i) => t === (i + 1) % tiles.length);
function checkSlide({ n, tiles }, s) {
  if (!isInts(s) || s.length > 5000) return false;
  const t = [...tiles];
  let gap = t.indexOf(0);
  for (const c of s) {
    if (!isNext(n, gap, c)) return false;
    [t[gap], t[c]] = [t[c], 0];
    gap = c;
  }
  return slideDone(t);
}

// flood: each move paints the area joined to the top-left cell in a new colour. s = the colours picked
export function floodPaint(n, grid, color) {
  const g = [...grid];
  const from = g[0];
  if (from === color) return g;
  const todo = [0];
  g[0] = color;
  while (todo.length) for (const j of neighbours(n, todo.pop())) if (g[j] === from) { g[j] = color; todo.push(j); }
  return g;
}
function checkFlood({ n, colors, grid, moves }, s) {
  if (!isInts(s) || s.length > moves || s.some((c) => c < 0 || c >= colors)) return false;
  const end = s.reduce((g, c) => floodPaint(n, g, c), grid);
  return end.every((c) => c === end[0]);
}

// target: join two numbers with + − × ÷ (whole, positive results only) until the target appears.
// s = [i, op, j] triples; indexes point into the current list, where the two used numbers leave and the result
// joins the end
export const OPS = ["+", "−", "×", "÷"];
export function applyOp(a, op, b) {
  if (op === 0) return a + b;
  if (op === 1) return a - b > 0 ? a - b : null;
  if (op === 2) return a * b;
  if (op === 3) return b !== 0 && a % b === 0 ? a / b : null;
  return null;
}
export function targetStep(list, i, op, j) {
  if (i === j || i < 0 || j < 0 || i >= list.length || j >= list.length) return null;
  const r = applyOp(list[i], op, list[j]);
  if (r === null) return null;
  return [...list.filter((_, k) => k !== i && k !== j), r];
}
function checkTarget({ nums, target }, s) {
  if (!isInts(s) || !s.length || s.length % 3 || s.length > 3 * (nums.length - 1)) return false;
  let list = nums;
  for (let k = 0; k < s.length; k += 3) {
    list = targetStep(list, s[k], s[k + 1], s[k + 2]);
    if (!list) return false;
  }
  return list.includes(target);
}

// word search: the cells from a to b in a straight line (across, down or diagonal), or null
export function lineCells(n, a, b) {
  const dr = Math.floor(b / n) - Math.floor(a / n), dc = (b % n) - (a % n);
  if (dr && dc && Math.abs(dr) !== Math.abs(dc)) return null;
  const len = Math.max(Math.abs(dr), Math.abs(dc));
  return Array.from({ length: len + 1 }, (_, k) => a + (Math.sign(dr) * n + Math.sign(dc)) * k);
}
// s = [first cell, last cell] for each word, in the puzzle's word order
function checkWords({ n, letters, words }, s) {
  if (!isInts(s, words.length * 2) || !inGrid(n, s)) return false;
  return words.every((w, k) => {
    const cells = lineCells(n, s[2 * k], s[2 * k + 1]);
    return !!cells && cells.map((i) => letters[i]).join("") === w;
  });
}

// pipes: tile bits 1 up, 2 right, 4 down, 8 left. Turn the tiles so every pipe end meets another and all of them
// join the source. s = clockwise quarter turns for every tile
export const turn = (mask, times) => {
  let m = mask;
  for (let k = 0; k < ((times % 4) + 4) % 4; k++) m = ((m << 1) & 15) | (m >> 3);
  return m;
};
const DIRS = [[1, -1, 0, 4], [2, 0, 1, 8], [4, 1, 0, 1], [8, 0, -1, 2]]; // bit, dr, dc, the opposite bit
export function pipesFlow(n, masks, source) {
  const link = (i, [bit, dr, dc, back]) => {
    if (!(masks[i] & bit)) return null;
    const r = Math.floor(i / n) + dr, c = (i % n) + dc;
    if (r < 0 || r >= n || c < 0 || c >= n) return -1;
    const j = r * n + c;
    return masks[j] & back ? j : -1;
  };
  const loose = new Set();
  for (let i = 0; i < n * n; i++) for (const d of DIRS) if (link(i, d) === -1) loose.add(i);
  const wet = new Set([source]);
  const todo = [source];
  while (todo.length) {
    const i = todo.pop();
    for (const d of DIRS) {
      const j = link(i, d);
      if (j !== null && j >= 0 && !wet.has(j)) { wet.add(j); todo.push(j); }
    }
  }
  return { wet, loose };
}
function checkPipes({ n, tiles, source }, s) {
  if (!isInts(s, n * n) || s.some((t) => t < 0 || t > 3)) return false;
  const { wet, loose } = pipesFlow(n, tiles.map((m, i) => turn(m, s[i])), source);
  return wet.size === n * n && loose.size === 0;
}

// ball sort: move the top ball onto an empty tube or onto the same colour, until each tube holds one colour.
// tubes are listed bottom to top. s = [from, to] pairs
export function ballsMove(tubes, cap, from, to) {
  const a = tubes[from], b = tubes[to];
  if (!a || !b || from === to || !a.length || b.length >= cap) return null;
  if (b.length && b[b.length - 1] !== a[a.length - 1]) return null;
  const next = tubes.map((t) => [...t]);
  next[to].push(next[from].pop());
  return next;
}
export const ballsDone = (tubes, cap) => tubes.every((t) => !t.length || (t.length === cap && t.every((x) => x === t[0])));
function checkBalls({ cap, tubes }, s) {
  if (!isInts(s) || s.length % 2 || s.length > 4000) return false;
  let t = tubes;
  for (let k = 0; k < s.length; k += 2) {
    t = ballsMove(t, cap, s[k], s[k + 1]);
    if (!t) return false;
  }
  return ballsDone(t, cap);
}

const CHECKS = {
  crowns: checkCrowns, sunmoon: checkSunmoon, path: checkPath, maze: checkMaze, oneline: checkOneline, link: checkLink,
  sudoku: checkSudoku, futoshiki: checkFutoshiki, skyscraper: checkSkyscraper, lights: checkLights, nonogram: checkNonogram,
  hitori: checkHitori, tents: checkTents, akari: checkAkari, slide: checkSlide, flood: checkFlood, target: checkTarget,
  words: checkWords, pipes: checkPipes, balls: checkBalls,
};

export function checkPuzzle(puzzle, s) {
  try {
    return !!CHECKS[puzzle.kind]?.(puzzle, s);
  } catch {
    return false;
  }
}
