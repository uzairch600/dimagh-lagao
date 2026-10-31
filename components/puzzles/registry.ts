import type { PuzzleKind } from "@/lib/types";
import SAMPLES from "@/lib/puzzle-samples.json";
import type { Of, PuzzleDef } from "./types";
import { crowns, maze, oneline, path, sunmoon } from "./kinds/classic";
import { link, pipes, words } from "./kinds/lines";
import { balls, flood, slide, target } from "./kinds/moves";
import { futoshiki, skyscraper, sudoku } from "./kinds/numbers";
import { akari, hitori, lights, nonogram, tents } from "./kinds/shading";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDef = PuzzleDef<any, any>;

export const PUZZLES: Record<PuzzleKind, AnyDef> = {
  crowns, sunmoon, path, maze, oneline, link, sudoku, futoshiki, skyscraper, lights,
  nonogram, hitori, tents, akari, slide, flood, target, words, pipes, balls,
};

// Filters on the Khelein screen.
export const FAMILIES: { id: string; name: string; kinds: PuzzleKind[] }[] = [
  { id: "quick", name: "Jaldi wale", kinds: ["maze", "words", "balls", "slide", "flood", "pipes", "target", "lights"] },
  { id: "lines", name: "Raaste", kinds: ["path", "maze", "oneline", "link", "pipes"] },
  { id: "logic", name: "Dimaghi", kinds: ["crowns", "sunmoon", "sudoku", "futoshiki", "skyscraper", "nonogram", "hitori", "tents", "akari"] },
];

// Tiny generated boards with solutions (scripts/make-puzzle-samples.js): [0] for the walkthrough and card art,
// the rest for practice.
export type Sample<K extends PuzzleKind = PuzzleKind> = { puzzle: Of<K>; solution: number[] };
export const samplesFor = (kind: PuzzleKind) => (SAMPLES as unknown as Record<PuzzleKind, Sample[]>)[kind];

export const isPuzzleKind = (id: string): id is PuzzleKind => id in PUZZLES;
