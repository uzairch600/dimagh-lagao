// Puzzles drawn as lines through the grid. Each maker returns { puzzle, solution } (rules: lib/puzzle-rules.js).
import { mazeOpen, turn } from "../../lib/puzzle-rules.js";
import { neighbours, pick, rand, range, shuffle } from "./util.js";

// A random path through every cell: start with a snake and apply many "backbite" moves.
function hamiltonPath(n) {
  let path = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) path.push(r * n + (r % 2 ? n - 1 - c : c));
  for (let step = 0; step < n * n * 40; step++) {
    if (rand(2)) path.reverse();
    const end = path[path.length - 1];
    const x = pick(neighbours(n, end).filter((x) => x !== path[path.length - 2]));
    const i = path.indexOf(x);
    path = [...path.slice(0, i + 1), ...path.slice(i + 1).reverse()];
  }
  return path;
}

// ---------- number path: 1, 2, 3… in order through every cell ----------

// fewer numbers = fewer hints = harder
export function path(n, count = n + 2) {
  const solution = hamiltonPath(n);
  const marks = new Set([0, solution.length - 1]);
  while (marks.size < count) marks.add(1 + rand(solution.length - 2));
  const numbers = [...marks].sort((a, b) => a - b).map((pos, k) => [solution[pos], k + 1]);
  return { puzzle: { kind: "path", n, numbers }, solution };
}

// ---------- maze ----------

export function maze(n) {
  const open = new Array(n * n).fill(0);
  const seen = new Array(n * n).fill(false);
  const stack = [0];
  seen[0] = true;
  while (stack.length) {
    const i = stack[stack.length - 1];
    const next = neighbours(n, i).filter((j) => !seen[j]);
    if (!next.length) { stack.pop(); continue; }
    const j = pick(next);
    const [a, b] = i < j ? [i, j] : [j, i];
    open[a] |= b === a + 1 ? 1 : 2;
    seen[j] = true;
    stack.push(j);
  }
  const start = 0, end = n * n - 1;
  const prev = new Map([[start, -1]]);
  const queue = [start];
  while (queue.length) {
    const i = queue.shift();
    for (const j of neighbours(n, i)) if (!prev.has(j) && mazeOpen(n, open, i, j)) { prev.set(j, i); queue.push(j); }
  }
  const solution = [];
  for (let i = end; i !== -1; i = prev.get(i)) solution.unshift(i);
  return { puzzle: { kind: "maze", n, open, start, end }, solution };
}

// ---------- one line through every open cell ----------

// A random walk that prefers cells with the fewest ways onward (so it rarely strands cells); the cells it
// never reaches become the blocks.
export function oneline(n) {
  const maxBlocked = Math.max(2, Math.round(n * n * 0.14));
  for (;;) {
    const start = rand(n * n);
    const seen = new Set([start]);
    const walk = [start];
    for (;;) {
      const next = neighbours(n, walk[walk.length - 1]).filter((j) => !seen.has(j));
      if (!next.length) break;
      const onward = (j) => neighbours(n, j).filter((k) => !seen.has(k)).length;
      const fewest = Math.min(...next.map(onward));
      const j = rand(100) < 85 ? pick(next.filter((x) => onward(x) === fewest)) : pick(next);
      seen.add(j);
      walk.push(j);
    }
    const blocked = range(n * n).filter((i) => !seen.has(i));
    if (blocked.length >= 1 && blocked.length <= maxBlocked) return { puzzle: { kind: "oneline", n, blocked, start }, solution: walk };
  }
}

// ---------- colour link: join each pair of dots, fill every cell ----------

export function link(n, pairs) {
  for (;;) {
    const full = hamiltonPath(n);
    // cut the path into `pairs` pieces of at least 3 cells
    const lengths = new Array(pairs).fill(3);
    for (let left = n * n - 3 * pairs; left > 0; left--) lengths[rand(pairs)]++;
    const lines = [];
    let at = 0;
    for (const len of shuffle(lengths)) { lines.push(full.slice(at, at + len)); at += len; }
    // pieces whose two ends sit side by side make a dull one-step join: try again
    if (lines.some((l) => neighbours(n, l[0]).includes(l[l.length - 1]))) continue;
    const ends = lines.map((l) => [l[0], l[l.length - 1]]);
    return { puzzle: { kind: "link", n, ends }, solution: lines.flatMap((l, k) => (k ? [-1, ...l] : l)) };
  }
}

// ---------- word search ----------

const THEMES = {
  "Pakistan ke shehar": ["LAHORE", "KARACHI", "QUETTA", "MULTAN", "MURREE", "HUNZA", "SIALKOT", "PESHAWAR", "GILGIT", "SKARDU", "SUKKUR", "GWADAR", "CHITRAL", "SWAT", "KASUR", "OKARA", "JHELUM", "MARDAN"],
  "Khaane": ["BIRYANI", "NIHARI", "KARAHI", "HALEEM", "SAMOSA", "PAKORA", "JALEBI", "KHEER", "LASSI", "PARATHA", "KABAB", "TIKKA", "PULAO", "QORMA", "HALWA", "CHAAT", "SAAG", "ROTI"],
  "Cricket": ["BOWLER", "WICKET", "SIXER", "GOOGLY", "YORKER", "BOUNCER", "CAPTAIN", "UMPIRE", "INNINGS", "STUMPS", "CREASE", "BATTER", "SPIN", "OVER", "CATCH", "PITCH", "SWING"],
  "Phal": ["MANGO", "APPLE", "GUAVA", "BANANA", "ORANGE", "KINNOW", "CHEEKU", "PAPAYA", "LYCHEE", "GRAPES", "MELON", "PEACH", "PLUM", "CHERRY", "APRICOT", "DATES"],
  "Janwar": ["MARKHOR", "TIGER", "CAMEL", "HORSE", "EAGLE", "PARROT", "DOLPHIN", "LEOPARD", "RABBIT", "DONKEY", "PEACOCK", "SPARROW", "BEAR", "WOLF", "GOAT", "ZEBRA"],
  "Rang": ["RED", "BLUE", "GREEN", "YELLOW", "PURPLE", "ORANGE", "BLACK", "WHITE", "PINK", "BROWN", "GOLDEN", "SILVER", "MAROON", "OLIVE", "INDIGO"],
};
const DIRS = { across: [0, 1], down: [1, 0], diagDown: [1, 1], diagUp: [-1, 1] };

export function words(n, count, backwards) {
  const theme = pick(Object.keys(THEMES));
  const dirs = Object.values(backwards ? DIRS : { across: DIRS.across, down: DIRS.down, diagDown: DIRS.diagDown });
  for (;;) {
    const list = shuffle(THEMES[theme].filter((w) => w.length <= n)).slice(0, count);
    const grid = new Array(n * n).fill("");
    const solution = [];
    const placed = list.every((w) => {
      const word = backwards && rand(3) === 0 ? [...w].reverse().join("") : w; // some words run backwards
      for (let tries = 0; tries < 200; tries++) {
        const [dr, dc] = pick(dirs);
        const r0 = rand(n), c0 = rand(n);
        const cells = [...word].map((_, k) => [r0 + dr * k, c0 + dc * k]);
        if (cells.some(([r, c]) => r < 0 || r >= n || c < 0 || c >= n)) continue;
        const idx = cells.map(([r, c]) => r * n + c);
        if (idx.some((i, k) => grid[i] && grid[i] !== word[k])) continue;
        idx.forEach((i, k) => (grid[i] = word[k]));
        const [a, b] = [idx[0], idx[idx.length - 1]];
        solution.push(...(word === w ? [a, b] : [b, a]));
        return true;
      }
      return false;
    });
    if (!placed) continue;
    // fill the rest with letters from the theme's own words, so stray letters don't stand out
    const pool = THEMES[theme].join("");
    const letters = grid.map((ch) => ch || pool[rand(pool.length)]).join("");
    return { puzzle: { kind: "words", n, letters, words: list, theme }, solution };
  }
}

// ---------- pipes: turn the tiles until water reaches every pipe ----------

export function pipes(n) {
  const bit = (a, b) => (b === a - n ? 1 : b === a + 1 ? 2 : b === a + n ? 4 : 8);
  const back = { 1: 4, 2: 8, 4: 1, 8: 2 };
  const source = Math.floor(n / 2) * n + Math.floor(n / 2);
  let masks;
  // random spanning tree, grown from random frontier cells (a branchy network). Crossroads look the same
  // whichever way they turn, so a few tries look for a tree without one.
  for (let attempt = 0; attempt < 30; attempt++) {
    masks = new Array(n * n).fill(0);
    const inTree = new Set([source]);
    const frontier = neighbours(n, source).map((j) => [source, j]);
    while (frontier.length) {
      const [a, b] = frontier.splice(rand(frontier.length), 1)[0];
      if (inTree.has(b)) continue;
      masks[a] |= bit(a, b);
      masks[b] |= back[bit(a, b)];
      inTree.add(b);
      for (const j of neighbours(n, b)) if (!inTree.has(j)) frontier.push([b, j]);
    }
    if (!masks.includes(15)) break;
  }
  const spins = masks.map(() => rand(4));
  const tiles = masks.map((m, i) => turn(m, spins[i]));
  return { puzzle: { kind: "pipes", n, tiles, source }, solution: spins.map((s) => (4 - s) % 4) };
}
