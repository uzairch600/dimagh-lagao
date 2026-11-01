// The "Puzzles" section: 20 puzzle games. Each board is generated on the server and both players get the same one.
// The server judges a submitted solution with the shared rules in lib/puzzle-rules.js, so any valid solution counts.
// Makers live in server/puzzles/: grids.js (fill or mark cells), lines.js (draw lines), moves.js (a series of moves).
import crypto from "node:crypto";
import { checkPuzzle } from "../lib/puzzle-rules.js";
import * as G from "./puzzles/grids.js";
import * as L from "./puzzles/lines.js";
import * as M from "./puzzles/moves.js";

export const PUZZLES_PER_MATCH = 3;

// In the order they appear on the Khelein screen (easiest to pick up first).
// demo: a tiny board for the "how to play" walkthrough.
// levels: [easier, MATCH, harder]. A match is one board at level 1, with level 1's own time (35-90 s, kept tight so
// solving one in time means something on the leaderboard).
const PUZZLES = [
  { id: "crowns", name: "Taaj", urdu: "تاج", demo: () => G.crowns(5),
    levels: [[() => G.crowns(6), 90], [() => G.crowns(7), 70], [() => G.crowns(7), 90]] },
  { id: "sunmoon", name: "Suraj Chaand", urdu: "سورج چاند", demo: () => G.sunmoon(4, 2),
    levels: [[() => G.sunmoon(6, 6), 90], [() => G.sunmoon(8, 6), 75], [() => G.sunmoon(8, 3), 120]] },
  { id: "path", name: "Number Raasta", urdu: "نمبر راستہ", demo: () => L.path(4),
    levels: [[() => L.path(6), 90], [() => L.path(8, 7), 60], [() => L.path(8, 6), 120]] },
  { id: "maze", name: "Bhool Bhulaiyan", urdu: "بھول بھلیاں", demo: () => L.maze(5),
    levels: [[() => L.maze(14), 60], [() => L.maze(20), 35], [() => L.maze(25), 120]] },
  { id: "words", name: "Lafz Dhoondo", urdu: "لفظ ڈھونڈو", demo: () => L.words(5, 3, false),
    levels: [[() => L.words(8, 6, false), 80], [() => L.words(10, 9, true), 60], [() => L.words(11, 11, true), 120]] },
  { id: "balls", name: "Gend Tarteeb", urdu: "گیند ترتیب", demo: () => M.balls(3),
    levels: [[() => M.balls(5), 90], [() => M.balls(6), 60], [() => M.balls(7), 120]] },
  { id: "slide", name: "Khiskao", urdu: "کھسکاؤ", demo: () => M.slide(3, 8),
    levels: [[() => M.slide(3, 40), 90], [() => M.slide(4, 30), 70], [() => M.slide(4, 60), 150]] },
  { id: "target", name: "Hisaab Jor", urdu: "حساب جوڑ", demo: () => M.target(3, null, [10, 40]),
    levels: [[() => M.target(5, [10, 25], [30, 150]), 90], [() => M.target(5, [25, 50, 75, 100], [101, 500]), 45], [() => M.target(6, [25, 50, 75, 100], [200, 900]), 120]] },
  { id: "link", name: "Rang Jor", urdu: "رنگ جوڑ", demo: () => L.link(4, 3),
    levels: [[() => L.link(6, 5), 90], [() => L.link(8, 7), 55], [() => L.link(9, 8), 120]] },
  { id: "pipes", name: "Pipe Jor", urdu: "پائپ جوڑ", demo: () => L.pipes(3),
    levels: [[() => L.pipes(5), 70], [() => L.pipes(7), 50], [() => L.pipes(8), 120]] },
  { id: "flood", name: "Rang Bhar", urdu: "رنگ بھر", demo: () => M.flood(5, 3),
    levels: [[() => M.flood(8, 5), 60], [() => M.flood(12, 6), 35], [() => M.flood(14, 6), 120]] },
  { id: "lights", name: "Batti Gul", urdu: "بتی گل", demo: () => G.lights(3, 2),
    levels: [[() => G.lights(5, 4), 90], [() => G.lights(5, 9), 60], [() => G.lights(6, 12), 150]] },
  { id: "sudoku", name: "Sudoku", urdu: "سوڈوکو", demo: () => G.sudoku(4, [2, 2], 2),
    levels: [[() => G.sudoku(6, [2, 3], 0), 100], [() => G.sudoku(9, [3, 3], 22), 90], [() => G.sudoku(9, [3, 3], 12), 150]] },
  { id: "oneline", name: "Ek Lakeer", urdu: "ایک لکیر", demo: () => L.oneline(4),
    levels: [[() => L.oneline(6), 70], [() => L.oneline(9), 50], [() => L.oneline(9), 120]] },
  { id: "nonogram", name: "Chhupi Tasveer", urdu: "چھپی تصویر", demo: () => G.nonogram(4),
    levels: [[() => G.nonogram(6), 90], [() => G.nonogram(8), 70], [() => G.nonogram(10), 150]] },
  { id: "futoshiki", name: "Chhota Bara", urdu: "چھوٹا بڑا", demo: () => G.futoshiki(4, 5, 2),
    levels: [[() => G.futoshiki(5, 8, 0), 100], [() => G.futoshiki(6, 12, 0), 90], [() => G.futoshiki(6, 9, 0), 120]] },
  { id: "skyscraper", name: "Oonchi Imaratein", urdu: "اونچی عمارتیں", demo: () => G.skyscraper(4, 4),
    levels: [[() => G.skyscraper(4, 0), 90], [() => G.skyscraper(5, 0), 75], [() => G.skyscraper(5, 0), 120]] },
  { id: "tents", name: "Khaime", urdu: "خیمے", demo: () => G.tents(5),
    levels: [[() => G.tents(7), 90], [() => G.tents(9), 60], [() => G.tents(10), 120]] },
  { id: "akari", name: "Roshni", urdu: "روشنی", demo: () => G.akari(5),
    levels: [[() => G.akari(7), 90], [() => G.akari(8), 55], [() => G.akari(10), 120]] },
  { id: "hitori", name: "Dohra Hatao", urdu: "دہرا ہٹاؤ", demo: () => G.hitori(4),
    levels: [[() => G.hitori(6), 90], [() => G.hitori(8), 55], [() => G.hitori(9), 120]] },
];

export const PUZZLE_KINDS = PUZZLES.map((p) => p.id);
// The time of a match board (level 1) for each kind, shown on the cards and the rules screen.
export const PUZZLE_SECONDS = Object.fromEntries(PUZZLES.map((p) => [p.id, p.levels[1][1]]));
// Category entries for the Khelein screen (server/questions.js adds them to CATEGORIES).
export const PUZZLE_CATEGORIES = PUZZLES.map(({ id, name, urdu }) => ({ id, name, urdu, group: "puzzle" }));

const byId = new Map(PUZZLES.map((p) => [p.id, p]));

// One board of a match. level 0..2: size and time grow over the 3 boards.
export async function puzzleRound(kind, level) {
  const [make, seconds] = byId.get(kind).levels[Math.min(level, 2)];
  // crowns can (very rarely) fail to find a unique layout at 7x7: fall back one size down
  const made = (await make()) ?? (await G.crowns(6));
  return { id: `${kind}_${crypto.randomBytes(5).toString("hex")}`, kind, seconds, ...made, check: (s) => checkPuzzle(made.puzzle, s) };
}

// A tiny board with its solution, for the walkthrough (scripts/make-puzzle-samples.js).
export const demoPuzzle = async (kind) => byId.get(kind).demo();
