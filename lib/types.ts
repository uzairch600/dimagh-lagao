export type Category = { id: string; name: string; urdu: string; icon: string };
export type Tier = { entry: number; prize: number };

export type Config = {
  demoMode: boolean;
  categories: Category[];
  tiers: Tier[];
  questions: number;
  seconds: number;
  minWithdraw: number;
  houseMaxEntry: number;
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
  mode: "paid" | "house" | "practice";
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
  mode: "paid" | "house" | "practice";
  category: string;
  entry: number;
  prize: number;
  total: number;
  seconds: number;
  resumed?: boolean;
  preparing?: boolean;
  you: PlayerInfo;
  opponent: PlayerInfo;
  balance: number;
};

export type Question = { index: number; total: number; text: string; options: string[]; seconds: number };

export type Reveal = {
  index: number;
  answerIndex: number;
  you: { choice: number | null; points: number; score: number };
  opponent: { choice: number | null; points: number; score: number };
};

export type MatchEnd = {
  mode: "paid" | "house" | "practice";
  outcome: "win" | "loss" | "draw";
  prize: number;
  entry: number;
  you: { score: number; correct: number };
  opponent: { name: string; score: number; correct: number };
  total: number;
  balance: number;
};

export type Screen = "login" | "home" | "play" | "searching" | "versus" | "match" | "result" | "wallet" | "leaderboard" | "profile";
