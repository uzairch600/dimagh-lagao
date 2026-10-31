// Puzzles solved by a series of moves. Each maker returns { puzzle, solution } (rules: lib/puzzle-rules.js).
import { applyOp, ballsDone, ballsMove, floodPaint, slideDone, targetStep } from "../../lib/puzzle-rules.js";
import { neighbours, pick, rand, range, shuffle } from "./util.js";

// ---------- sliding tiles ----------

// Walks the gap around at random from the solved board; the solution walks it back.
export function slide(n, steps) {
  for (;;) {
    const tiles = range(n * n).map((i) => (i + 1) % (n * n));
    const trail = [n * n - 1];
    for (let k = 0; k < steps; k++) {
      const gap = trail[trail.length - 1];
      const next = pick(neighbours(n, gap).filter((j) => j !== trail[trail.length - 2]));
      [tiles[gap], tiles[next]] = [tiles[next], 0];
      trail.push(next);
    }
    const misplaced = tiles.filter((t, i) => t && t !== i + 1).length;
    if (slideDone(tiles) || misplaced < (n * n) / 2) continue;
    return { puzzle: { kind: "slide", n, tiles }, solution: trail.slice(0, -1).reverse() };
  }
}

// ---------- colour flood ----------

function areaSize(n, g) {
  const seen = new Set([0]);
  const todo = [0];
  while (todo.length) for (const j of neighbours(n, todo.pop())) if (g[j] === g[0] && !seen.has(j)) { seen.add(j); todo.push(j); }
  return seen.size;
}

// The move limit is what a two-moves-ahead search needs, so it can always be met (often beaten).
export function flood(n, colors) {
  const grid = range(n * n).map(() => rand(colors));
  const moves = [];
  for (let g = grid; areaSize(n, g) < n * n; ) {
    let best = -1, bestScore = -1;
    for (let c = 0; c < colors; c++) {
      if (c === g[0]) continue;
      const a = floodPaint(n, g, c);
      const now = areaSize(n, a);
      let ahead = now;
      if (now < n * n) for (let d = 0; d < colors; d++) if (d !== c) ahead = Math.max(ahead, areaSize(n, floodPaint(n, a, d)));
      const score = (now === n * n ? 1e6 : ahead * 1000) + now;
      if (score > bestScore) { bestScore = score; best = c; }
    }
    moves.push(best);
    g = floodPaint(n, g, best);
  }
  return { puzzle: { kind: "flood", n, colors, grid, moves: moves.length }, solution: moves };
}

// ---------- target number ----------

// Plays random sums from random numbers and keeps the result as the target when it needs at least two steps.
export function target(count, bigs, [lo, hi]) {
  for (;;) {
    const small = range(count - (bigs ? 1 : 0)).map(() => 1 + rand(9));
    const nums = shuffle(bigs ? [...small, pick(bigs)] : small);
    let list = nums;
    const solution = [];
    const steps = 2 + rand(count - 2);
    for (let k = 0; k < steps; k++) {
      for (let tries = 0; tries < 30; tries++) {
        const i = rand(list.length), j = rand(list.length);
        const op = pick([0, 0, 1, 2, 2, 3]);
        if (i === j || (op >= 2 && (list[i] === 1 || list[j] === 1))) continue; // × 1 and ÷ 1 change nothing
        const next = targetStep(list, i, op, j);
        if (!next) continue;
        list = next;
        solution.push(i, op, j);
        break;
      }
    }
    const goal = list[list.length - 1];
    if (solution.length < 6 || goal < lo || goal > hi || nums.includes(goal)) continue;
    // one sum straight from the start would make it too easy
    const oneStep = nums.some((a, i) => nums.some((b, j) => i !== j && [0, 1, 2, 3].some((op) => applyOp(a, op, b) === goal)));
    if (oneStep) continue;
    return { puzzle: { kind: "target", n: count, nums, target: goal }, solution };
  }
}

// ---------- ball sort ----------

function solveBalls(start, cap) {
  const seen = new Set();
  const moves = [];
  let nodes = 0;
  const key = (t) => t.map((x) => x.join("")).sort().join("|");
  const oneColour = (t) => t.every((x) => x === t[0]);
  const dfs = (t) => {
    if (ballsDone(t, cap)) return true;
    if (++nodes > 30000) return false;
    const k = key(t);
    if (seen.has(k)) return false;
    seen.add(k);
    const options = [];
    for (let from = 0; from < t.length; from++) {
      const a = t[from];
      if (!a.length || (a.length === cap && oneColour(a))) continue;
      for (let to = 0; to < t.length; to++) {
        const b = t[to];
        // moving a one-colour tube into an empty one, or into a later empty tube, gets nowhere new
        if (!b.length && (oneColour(a) || t.findIndex((x) => !x.length) !== to)) continue;
        const next = ballsMove(t, cap, from, to);
        if (next) options.push([b.length ? 1 : 0, from, to, next]);
      }
    }
    options.sort((x, y) => y[0] - x[0]);
    for (const [, from, to, next] of options) {
      moves.push(from, to);
      if (dfs(next)) return true;
      moves.length -= 2;
    }
    return false;
  };
  return dfs(start) ? moves : null;
}

// Fewest moves, by breadth-first search. Only for the tiny walkthrough boards, where the state space is small.
function shortestBalls(start, cap) {
  const key = (t) => JSON.stringify(t);
  const prev = new Map([[key(start), null]]);
  const queue = [start];
  while (queue.length) {
    const t = queue.shift();
    if (ballsDone(t, cap)) {
      const moves = [];
      for (let k = key(t); prev.get(k); k = key(prev.get(k).from)) moves.unshift(...prev.get(k).move);
      return moves;
    }
    for (let from = 0; from < t.length; from++) for (let to = 0; to < t.length; to++) {
      const next = ballsMove(t, cap, from, to);
      if (next && !prev.has(key(next))) { prev.set(key(next), { from: t, move: [from, to] }); queue.push(next); }
    }
  }
  return null;
}

export function balls(colors, cap = 4) {
  for (;;) {
    const all = shuffle(range(colors).flatMap((c) => new Array(cap).fill(c)));
    const tubes = [...range(colors).map((t) => all.slice(t * cap, (t + 1) * cap)), [], []];
    // a tube that starts with 3 of one colour gives a free head start: shuffle again
    if (tubes.some((t) => t.length && t.filter((x) => x === t[0]).length >= cap - 1)) continue;
    const solution = colors <= 3 ? shortestBalls(tubes, cap) : solveBalls(tubes, cap);
    if (solution) return { puzzle: { kind: "balls", n: tubes.length, cap, tubes }, solution };
  }
}
