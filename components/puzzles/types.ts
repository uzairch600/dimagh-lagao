import type { Puzzle, PuzzleKind } from "@/lib/types";

export type Of<K extends PuzzleKind> = Extract<Puzzle, { kind: K }>;

// A board is fully controlled: it draws `state` and, when `set` is given, turns taps and drags into a new state.
// Without `set` it is a picture (card art, the solution after a round, the walkthrough).
export type BoardProps<K extends PuzzleKind, S> = { puzzle: Of<K>; state: S; set?: (next: S) => void };

// One frame of the "Kaise khelein" walkthrough. `at` is where the hand taps: a cell number, or the data-cell key
// of a button (e.g. "num-3", "tube-1"). `say` replaces the caption.
export type Step<S> = { state: S; at?: number | string; say?: string };

// Methods (not arrow properties) so every PuzzleDef<K, S> also fits the registry's PuzzleDef<any, any>.
export type PuzzleDef<K extends PuzzleKind, S> = {
  blurb: string; // one line on the Khelein card
  goal: string; // one line above the board in a match
  rules: string[]; // the rules, one per line
  how: string; // how to tap / drag
  init(p: Of<K>): S;
  Board(props: BoardProps<K, S>): React.ReactNode;
  // the board as a solution the server can judge, or null while it is not complete yet
  attempt(p: Of<K>, s: S): number[] | null;
  // the board with a solution on it (after the round, card art, end of the walkthrough)
  shown(p: Of<K>, solution: number[]): S;
  demo(p: Of<K>, solution: number[]): Step<S>[];
};
