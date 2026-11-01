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
export type Tier = { entry: number; prize: number };

export type Config = {
  demoMode: boolean;
  categories: Category[];
  tiers: Tier[]; // quiz entries
  puzzleTiers: Tier[]; // puzzle entries (smaller)
  challengeMaxEntry: number; // Puzzle Challenge only up to this entry
  noOpponentRefundSeconds: number; // bigger entries: refund after this long without an opponent
  questions: number;
  seconds: number;
  rake: number;
  scoring: { max: number; min: number; fullMs: number };
  minWithdraw: number;
  houseWaitSeconds: number;
  avatars: string[];
};

export type User = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  balance: number;
  wins: number;
  losses: number;
  draws: number;
  earnings: number;
};

export type Transaction = {
  id: string;
  type: "deposit" | "withdraw" | "entry" | "prize" | "refund";
  amount: number;
  note: string;
  balanceAfter: number;
  at: number;
};

export type Withdrawal = { id: string; txId: string; amount: number; method: string; account: string; status: string; at: number };

export type MatchSummary = {
  id: string;
  mode: "paid" | "challenge" | "practice";
  category: string;
  entry: number;
  prize: number;
  at: number;
  winner: string | null;
  players: { userId: string; name: string; score: number; correct: number }[];
};

export type LeaderRow = { id: string; name: string; avatar: string; wins: number; losses: number; earnings: number };

export type PlayerInfo = { name: string; avatar: string; bot?: boolean; score?: number };

export type MatchFound = {
  matchId: string;
  mode: "paid" | "challenge" | "practice";
  category: string;
  entry: number;
  prize: number;
  total: number;
  seconds: number;
  resumed?: boolean;
  solo?: boolean; // a puzzle played alone: there is no opponent to show
  you: PlayerInfo;
  opponent: PlayerInfo;
  balance: number;
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
  mode: "paid" | "challenge" | "practice";
  outcome: "win" | "loss" | "draw";
  prize: number;
  entry: number;
  rake?: number;
  held?: boolean;
  you: { score: number; correct: number };
  opponent: { name: string; score: number; correct: number };
  total: number;
  solo?: boolean;
  balance: number;
  forfeit?: { by: "you" | "opponent" | "both"; reason: string } | null;
  void?: boolean;
};

export type Screen = "login" | "home" | "play" | "searching" | "versus" | "match" | "result" | "wallet" | "leaderboard" | "profile";
