export type Category = { id: string; name: string; urdu: string; icon: string; group: "quiz" | "puzzle" };

// A puzzle board, as the server sends it (see server/puzzles.js; the rules are in lib/puzzle-rules.js).
// Cells are numbered row by row on an n x n grid.
export type Puzzle =
  | { kind: "crowns"; n: number; regions: number[] }
  | { kind: "sunmoon"; n: number; givens: number[]; hints: [number, number, boolean][] }
  | { kind: "path"; n: number; numbers: [number, number][] }
  | { kind: "maze"; n: number; open: number[]; start: number; end: number }
  | { kind: "oneline"; n: number; blocked: number[]; start: number }
  | { kind: "link"; n: number; ends: [number, number][] }
  | { kind: "sudoku"; n: number; box: [number, number]; givens: number[] }
  | { kind: "futoshiki"; n: number; givens: number[]; signs: [number, number][] }
  | { kind: "skyscraper"; n: number; givens: number[]; top: number[]; bottom: number[]; left: number[]; right: number[] }
  | { kind: "lights"; n: number; on: number[] }
  | { kind: "nonogram"; n: number; rows: number[][]; cols: number[][] }
  | { kind: "hitori"; n: number; nums: number[] }
  | { kind: "tents"; n: number; trees: number[]; rowCount: number[]; colCount: number[] }
  | { kind: "akari"; n: number; cells: number[] }
  | { kind: "slide"; n: number; tiles: number[] }
  | { kind: "flood"; n: number; colors: number; grid: number[]; moves: number }
  | { kind: "target"; n: number; nums: number[]; target: number }
  | { kind: "words"; n: number; letters: string; words: string[]; theme: string }
  | { kind: "pipes"; n: number; tiles: number[]; source: number }
  | { kind: "balls"; n: number; cap: number; tubes: number[][] };
export type PuzzleKind = Puzzle["kind"];
// Everything is free: no entry fees, no prizes from players.
export type Config = {
  categories: Category[];
  puzzleSeconds: Record<string, number>; // the time of a puzzle match, per puzzle kind
  questions: number;
  seconds: number;
  scoring: { max: number; min: number; fullMs: number };
  opponentWaitSeconds: number; // a quiz player waits this long for a real opponent, then the computer plays
  avatars: string[];
};

export type User = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  wins: number; // 1v1 wins against real players
  losses: number;
  draws: number;
  puzzles: number; // puzzles solved in time
};

// free: a 1v1 between two real players. practice: against the computer, or a puzzle played alone.
export type MatchMode = "free" | "practice";

export type MatchSummary = {
  id: string;
  mode: MatchMode;
  category: string;
  at: number;
  winner: string | null;
  players: { userId: string; name: string; score: number; correct: number }[];
};

export type LeaderRow = { id: string; name: string; avatar: string; wins: number; losses: number; puzzles: number };

export type PlayerInfo = { name: string; avatar: string; bot?: boolean; score?: number };

export type MatchFound = {
  matchId: string;
  mode: MatchMode;
  category: string;
  total: number;
  seconds: number;
  resumed?: boolean;
  solo?: boolean; // a puzzle played alone: there is no opponent to show
  you: PlayerInfo;
  opponent: PlayerInfo;
};

export type Question = {
  index: number;
  total: number;
  text: string;
  options: string[];
  seconds: number;
  puzzle?: Puzzle; // puzzle rounds: a board instead of options
};

export type Reveal = {
  index: number;
  answerIndex: number | null;
  solution?: number[]; // puzzle rounds: the generated solution
  you: { choice: number | null; points: number; score: number };
  opponent: { choice: number | null; points: number; score: number };
};

export type MatchEnd = {
  mode: MatchMode;
  outcome: "win" | "loss" | "draw";
  you: { score: number; correct: number };
  opponent: { name: string; score: number; correct: number };
  total: number;
  solo?: boolean;
  forfeit?: { by: "you" | "opponent" | "both"; reason: string } | null;
};

export type Screen = "login" | "home" | "play" | "searching" | "versus" | "match" | "result" | "leaderboard" | "profile";
