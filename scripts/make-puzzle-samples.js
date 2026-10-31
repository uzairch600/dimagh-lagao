// Writes lib/puzzle-samples.json: a few tiny boards per puzzle, with solutions, for the "Kaise khelein" walkthrough,
// the practice boards and the card pictures. Run again after changing a puzzle: node scripts/make-puzzle-samples.js
import fs from "node:fs";
import { PUZZLE_KINDS, demoPuzzle } from "../server/puzzles.js";
import { checkPuzzle } from "../lib/puzzle-rules.js";

const out = {};
for (const kind of PUZZLE_KINDS) {
  out[kind] = [];
  while (out[kind].length < 4) {
    const { puzzle, solution } = await demoPuzzle(kind);
    if (!checkPuzzle(puzzle, solution)) throw new Error(`${kind}: a generated solution failed its own check`);
    out[kind].push({ puzzle, solution });
  }
}
fs.writeFileSync(new URL("../lib/puzzle-samples.json", import.meta.url), JSON.stringify(out) + "\n");
console.log(`lib/puzzle-samples.json: ${PUZZLE_KINDS.length} puzzles x 4 samples`);
