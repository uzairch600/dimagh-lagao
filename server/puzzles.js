// Logic puzzles for the "Logic Puzzle" category, generated on the server (no AI).
// Every puzzle is checked by brute force: the clues allow exactly one arrangement, so the answer is always right.
// The time limit grows with the number of clues and the size of the puzzle.
import crypto from "node:crypto";

const ANIMALS = ["Cat", "Dog", "Rabbit", "Lion", "Tiger", "Bear", "Fox", "Owl", "Horse", "Goat", "Parrot", "Panda", "Deer", "Monkey", "Zebra", "Camel"];
const FOODS = ["carrots", "fish", "bones", "honey", "bananas", "seeds", "grass", "nuts"];

export const PUZZLES_PER_MATCH = 5;
const MIN_SECONDS = 20;
const MAX_SECONDS = 75;

const rand = (n) => crypto.randomInt(n);
const pick = (arr) => arr[rand(arr.length)];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function permutations(n) {
  if (n === 1) return [[0]];
  const out = [];
  for (const p of permutations(n - 1)) for (let i = 0; i <= p.length; i++) out.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
  return out;
}

// A solution: house[a] = house index of animal a (0 = left), food[a] = food index of animal a.
// A clue: { text, test(sol) }.

function houseClues(names, n, hard) {
  const the = (a) => `the ${names[a].toLowerCase()}`;
  const out = [];
  for (let a = 0; a < n; a++) {
    for (let k = 0; k < n; k++) {
      if (!hard) out.push({ direct: true, text: `${cap(the(a))} lives in house ${k + 1}.`, test: (s) => s.house[a] === k });
      out.push({ text: `${cap(the(a))} does not live in house ${k + 1}.`, test: (s) => s.house[a] !== k });
    }
    out.push({ text: `${cap(the(a))} lives in one of the two end houses.`, test: (s) => s.house[a] === 0 || s.house[a] === n - 1 });
    out.push({ text: `${cap(the(a))} does not live in an end house.`, test: (s) => s.house[a] !== 0 && s.house[a] !== n - 1 });
    for (let b = 0; b < n; b++) {
      if (a === b) continue;
      out.push({ text: `${cap(the(a))} lives somewhere left of ${the(b)}.`, test: (s) => s.house[a] < s.house[b] });
      out.push({ text: `${cap(the(a))} lives directly left of ${the(b)}.`, test: (s) => s.house[a] + 1 === s.house[b] });
      if (a < b) {
        out.push({ text: `${cap(the(a))} and ${the(b)} are neighbours.`, test: (s) => Math.abs(s.house[a] - s.house[b]) === 1 });
        out.push({ text: `${cap(the(a))} and ${the(b)} are not neighbours.`, test: (s) => Math.abs(s.house[a] - s.house[b]) !== 1 });
        out.push({ text: `There is exactly one house between ${the(a)} and ${the(b)}.`, test: (s) => Math.abs(s.house[a] - s.house[b]) === 2 });
      }
      for (let c = b + 1; c < n; c++) {
        if (c === a) continue;
        out.push({
          text: `${cap(the(a))} lives somewhere between ${the(b)} and ${the(c)}.`,
          test: (s) => (s.house[b] < s.house[a] && s.house[a] < s.house[c]) || (s.house[c] < s.house[a] && s.house[a] < s.house[b]),
        });
      }
    }
  }
  return out;
}

function foodClues(names, foods, n, hard) {
  const the = (a) => `the ${names[a].toLowerCase()}`;
  const out = [];
  for (let a = 0; a < n; a++) {
    for (let f = 0; f < n; f++) {
      if (!hard) out.push({ direct: true, text: `${cap(the(a))} eats ${foods[f]}.`, test: (s) => s.food[a] === f });
      out.push({ text: `${cap(the(a))} does not eat ${foods[f]}.`, test: (s) => s.food[a] !== f });
      for (let b = a + 1; b < n; b++) {
        out.push({ text: `Either ${the(a)} or ${the(b)} eats ${foods[f]}.`, test: (s) => s.food[a] === f || s.food[b] === f });
      }
      for (let g = f + 1; g < n; g++) {
        out.push({ text: `${cap(the(a))} eats either ${foods[f]} or ${foods[g]}.`, test: (s) => s.food[a] === f || s.food[a] === g });
      }
    }
  }
  return out;
}

// Clues that link houses and food (only in the combined puzzle).
function crossClues(names, foods, n) {
  const the = (a) => `the ${names[a].toLowerCase()}`;
  const eaterHouse = (s, f) => s.house[s.food.indexOf(f)];
  const out = [];
  for (let f = 0; f < n; f++) {
    for (let k = 0; k < n; k++) {
      out.push({ text: `The animal in house ${k + 1} eats ${foods[f]}.`, test: (s) => eaterHouse(s, f) === k });
      out.push({ text: `The animal in house ${k + 1} does not eat ${foods[f]}.`, test: (s) => eaterHouse(s, f) !== k });
    }
    for (let a = 0; a < n; a++) {
      out.push({ text: `The animal that eats ${foods[f]} lives directly left of ${the(a)}.`, test: (s) => eaterHouse(s, f) + 1 === s.house[a] });
      out.push({ text: `The animal that eats ${foods[f]} is a neighbour of ${the(a)}.`, test: (s) => Math.abs(eaterHouse(s, f) - s.house[a]) === 1 });
    }
  }
  return out;
}

// Adds clues until only one arrangement fits, then drops every clue that isn't needed.
// At most one "direct" clue ("the cat lives in house 2"), so the puzzle never just states the answers.
function chooseClues(candidates, solutions, truth) {
  const fits = shuffle(candidates.filter((c) => c.test(truth)));
  const chosen = [];
  let left = solutions;
  let direct = 0;
  for (const c of fits) {
    if (c.direct && direct >= 1) continue;
    if (c.direct) direct++;
    const next = left.filter(c.test);
    if (next.length < left.length) {
      chosen.push(c);
      left = next;
    }
    if (left.length === 1) break;
  }
  if (left.length !== 1) return null;
  for (const c of shuffle(chosen)) {
    const rest = chosen.filter((x) => x !== c);
    if (solutions.filter((s) => rest.every((r) => r.test(s))).length === 1) chosen.splice(chosen.indexOf(c), 1);
  }
  return chosen;
}

function seconds(clues, extra) {
  const s = Math.round((8 + clues * 5 + extra) / 5) * 5;
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, s));
}

// Four options with the right one among them.
function options(correct, all) {
  const wrong = shuffle(all.filter((x) => x !== correct)).slice(0, 3);
  const opts = shuffle([correct, ...wrong]);
  return { options: opts, answerIndex: opts.indexOf(correct) };
}

function housesPuzzle(n, hard) {
  const names = shuffle(ANIMALS).slice(0, n);
  const solutions = permutations(n).map((p) => ({ house: p }));
  const truth = pick(solutions);
  const clues = chooseClues(houseClues(names, n, hard), solutions, truth);
  if (!clues) return null;
  const houses = Array.from({ length: n }, (_, k) => `House ${k + 1}`);
  let text, answer, pool;
  if (rand(2)) {
    const k = rand(n);
    text = `Who lives in house ${k + 1}?`;
    answer = names[truth.house.indexOf(k)];
    pool = names;
  } else {
    const a = rand(n);
    text = `In which house does the ${names[a].toLowerCase()} live?`;
    answer = houses[truth.house[a]];
    pool = houses;
  }
  return {
    kind: "houses", text, clues: clues.map((c) => c.text), ...options(answer, pool),
    seconds: seconds(clues.length, n === 5 ? 5 : 0),
    chart: [{ rows: names, cols: houses.map((h) => h.replace("House ", "H")) }],
  };
}

function foodPuzzle(n, hard) {
  const names = shuffle(ANIMALS).slice(0, n);
  const foods = shuffle(FOODS).slice(0, n);
  const solutions = permutations(n).map((p) => ({ food: p }));
  const truth = pick(solutions);
  const clues = chooseClues(foodClues(names, foods, n, hard), solutions, truth);
  if (!clues) return null;
  let text, answer, pool;
  if (rand(2)) {
    const f = rand(n);
    text = `Who eats the ${foods[f]}?`;
    answer = names[truth.food.indexOf(f)];
    pool = names;
  } else {
    const a = rand(n);
    text = `What does the ${names[a].toLowerCase()} eat?`;
    answer = cap(foods[truth.food[a]]);
    pool = foods.map(cap);
  }
  return {
    kind: "food", text, clues: clues.map((c) => c.text), ...options(answer, pool),
    seconds: seconds(clues.length, 0),
    chart: [{ rows: names, cols: foods.map(cap) }],
  };
}

function comboPuzzle() {
  const n = 4;
  const names = shuffle(ANIMALS).slice(0, n);
  const foods = shuffle(FOODS).slice(0, n);
  const perms = permutations(n);
  const solutions = [];
  for (const house of perms) for (const food of perms) solutions.push({ house, food });
  const truth = pick(solutions);
  const candidates = [...houseClues(names, n, true), ...foodClues(names, foods, n, true), ...crossClues(names, foods, n)];
  const clues = chooseClues(candidates, solutions, truth);
  if (!clues) return null;
  const houses = Array.from({ length: n }, (_, k) => `House ${k + 1}`);
  let text, answer, pool;
  const kind = rand(3);
  if (kind === 0) {
    const k = rand(n);
    text = `What does the animal in house ${k + 1} eat?`;
    answer = cap(foods[truth.food[truth.house.indexOf(k)]]);
    pool = foods.map(cap);
  } else if (kind === 1) {
    const f = rand(n);
    text = `Who eats the ${foods[f]}?`;
    answer = names[truth.food.indexOf(f)];
    pool = names;
  } else {
    const f = rand(n);
    text = `In which house does the ${foods[f]}-eater live?`;
    answer = houses[truth.house[truth.food.indexOf(f)]];
    pool = houses;
  }
  return {
    kind: "combo", text, clues: clues.map((c) => c.text), ...options(answer, pool),
    seconds: seconds(clues.length, 10),
    chart: [
      { rows: names, cols: houses.map((h) => h.replace("House ", "H")) },
      { rows: names, cols: foods.map(cap) },
    ],
  };
}

// Easy to hard across the match.
const LEVELS = [
  () => housesPuzzle(4, false),
  () => (rand(2) ? foodPuzzle(4, false) : housesPuzzle(4, true)),
  () => (rand(2) ? foodPuzzle(4, true) : housesPuzzle(4, true)),
  () => housesPuzzle(5, true),
  () => comboPuzzle(),
];

export function puzzleQuestion(level) {
  const make = LEVELS[Math.min(level, LEVELS.length - 1)];
  for (let tries = 0; tries < 20; tries++) {
    const p = make();
    if (p) return { id: "puzzle_" + crypto.randomBytes(5).toString("hex"), ...p };
  }
  return { id: "puzzle_" + crypto.randomBytes(5).toString("hex"), ...housesPuzzle(4, false) };
}
