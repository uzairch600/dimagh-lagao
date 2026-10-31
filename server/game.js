// Matchmaking and live 1v1 matches. The server owns the clock and the answer key:
// clients never see the correct answer until both players have answered (or time runs out).
import crypto from "node:crypto";
import * as db from "./db.js";
import { CATEGORIES, prefetch, questionsForMatch } from "./questions.js";
import { PUZZLE_KINDS, puzzleRound } from "./puzzles.js";

export const QUESTIONS_PER_MATCH = 10;
// 10s: enough to read a hard question and four options on a phone, too short to ask an AI on a second
// phone and still score well (that takes 8-10s, which speed scoring turns into ~10-20 points).
export const SECONDS_PER_QUESTION = 10;
export const RAKE = 0.3; // platform share of the pot; the winner gets the other 70%
// Speed scoring: a right answer within the first FULL_POINTS_SHARE of the time earns MAX_POINTS (2s of a 10s
// question), then falls linearly to MIN_POINTS at the last second. A wrong answer earns 0.
export const MAX_POINTS = 100;
export const MIN_POINTS = 10;
export const FULL_POINTS_SHARE = 0.2;
const LATE_SHARE = 0.6; // a right answer after 60% of the time (6s of 10s) counts as "late" for the prize review
// Most questions get SECONDS_PER_QUESTION; logic puzzles carry their own time, set by how hard they are.
const secondsFor = (q) => q.seconds ?? SECONDS_PER_QUESTION;
export const ENTRY_TIERS = [20, 50, 100, 500, 1000]; // quiz
// Puzzles can be practised from a demo and solved quickly, so they stay small.
export const PUZZLE_TIERS = [20, 50, 100];
// The Puzzle Challenge (platform pays the prize) is only offered up to this entry. Bigger quiz entries wait for a
// real opponent, and get their entry back after NO_OPPONENT_REFUND_MS.
export const CHALLENGE_MAX_ENTRY = 100;
export const NO_OPPONENT_REFUND_MS = 120_000;
const tiersFor = (category) => (PUZZLE_KINDS.includes(category) ? PUZZLE_TIERS : ENTRY_TIERS);
const GRACE_MS = 600; // network allowance on the answer deadline
const REVEAL_MS = 1800;
const PUZZLE_REVEAL_MS = 4000; // time to look at the solution before the next puzzle
const COUNTDOWN_MS = 3500;
const RECONNECT_MS = 10_000; // a dropped player has this long to come back before forfeiting
const STRIKE_GAP_MS = 1500; // blur + visibilitychange fire together: count them once

export const prizeFor = (entry) => Math.round(entry * 2 * (1 - RAKE));

const queues = new Map(); // `${category}:${entry}` -> [{ userId, socket }]
const matches = new Map(); // matchId -> match
const activeByUser = new Map(); // userId -> matchId | "queue"

let io;
export function attach(server) {
  io = server;
}

export function status(userId) {
  const a = activeByUser.get(userId);
  return a === "queue" ? "searching" : a ? "playing" : "idle";
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const humans = (m) => m.players.filter((p) => !p.bot);

// ---------- matchmaking ----------

export function joinQueue(socket, user, { category, entry }) {
  if (!CATEGORIES.some((c) => c.id === category)) return { error: "Category nahi mili" };
  if (!tiersFor(category).includes(entry)) return { error: "Ghalat entry fee" };
  if (activeByUser.has(user.id)) return { error: "Aap pehle se match mein hain" };
  if (user.balance < entry) return { error: "Balance kam hai — pehle paise add karein" };

  // Joining the lobby is final: the entry is charged now and research for this category starts now.
  db.addTransaction(user.id, "entry", -entry, `Match entry (${categoryName(category)})`);
  prefetch(category, QUESTIONS_PER_MATCH);

  const key = `${category}:${entry}`;
  const q = queues.get(key) || [];
  const oppIndex = q.findIndex((w) => w.userId !== user.id && w.socket.connected);
  if (oppIndex >= 0) {
    const [opp] = q.splice(oppIndex, 1);
    startMatch({ mode: "paid", category, entry, a: { user: db.getUser(opp.userId), socket: opp.socket }, b: { user, socket }, since: opp.since });
    return { ok: true, balance: db.getUser(user.id).balance };
  }
  const waiting = { userId: user.id, socket, since: Date.now(), category, entry };
  q.push(waiting);
  queues.set(key, q);
  activeByUser.set(user.id, "queue");
  // no Puzzle Challenge above CHALLENGE_MAX_ENTRY: if nobody comes, the entry goes back
  if (entry > CHALLENGE_MAX_ENTRY) {
    setTimeout(() => {
      if (!(queues.get(key) || []).includes(waiting)) return;
      leaveQueue(user.id);
      db.addTransaction(user.id, "refund", entry, "Muqabil nahi mila — entry wapas");
      waiting.socket.emit("queue:cancelled", { reason: "2 minute mein muqabil nahi mila — entry wapas kar di gayi", balance: db.getUser(user.id).balance });
    }, NO_OPPONENT_REFUND_MS);
  }
  return { ok: true, waiting: true, balance: db.getUser(user.id).balance };
}

export function leaveQueue(userId) {
  for (const [key, q] of queues) {
    const i = q.findIndex((w) => w.userId === userId);
    if (i >= 0) q.splice(i, 1);
    if (!q.length) queues.delete(key);
  }
  if (activeByUser.get(userId) === "queue") activeByUser.delete(userId);
}

// There is no way back once a player is in the lobby (the AI is already working for them).
export function cancelSearch() {
  return { error: "Lobby mein aane ke baad match chhora nahi ja sakta" };
}

function categoryWaiting(category) {
  for (const [key, q] of queues) if (key.startsWith(category + ":") && q.length) return true;
  return false;
}

export function startPractice(socket, user, { category }) {
  if (!CATEGORIES.some((c) => c.id === category)) return { error: "Category nahi mili" };
  if (activeByUser.has(user.id)) return { error: "Aap pehle se match mein hain" };
  startMatch({ mode: "practice", category, entry: 0, a: { user, socket }, b: null });
  return { ok: true };
}

// No real opponent showed up within 30s (entries up to CHALLENGE_MAX_ENTRY): a solo Puzzle Challenge.
export function startChallenge(socket, user, { category, entry }) {
  if (!CATEGORIES.some((c) => c.id === category)) return { error: "Category nahi mili" };
  if (!tiersFor(category).includes(entry) || entry > CHALLENGE_MAX_ENTRY) return { error: "Is entry par Puzzle Challenge nahi hai" };
  // only from the lobby, where the entry was already paid
  const waiting = [...queues.values()].flat().find((w) => w.userId === user.id);
  if (!waiting || activeByUser.get(user.id) !== "queue") return { error: "Pehle lobby mein shamil hon" };
  leaveQueue(user.id);
  startMatch({ mode: "challenge", category, entry, a: { user, socket }, b: null, since: waiting.since });
  return { ok: true };
}

// ---------- match lifecycle ----------

export const HOUSE_WAIT_SECONDS = 30; // how long a player searches before the app plays them itself (any entry)
const LOBBY_MAX_MS = 60_000; // nobody waits in the lobby longer than this for the AI questions
const BOT_SKILL = {
  practice: { accuracy: 0.6, minMs: 2000, maxMs: 8500 },
};
const isPaid = (mode) => mode === "paid" || mode === "challenge";

// Every puzzle match is ONE puzzle with PUZZLE_SECONDS: a 1v1 race, or the solo Puzzle Challenge (nobody to play
// in 30s: solved = the prize, paid by the platform; not solved = the entry stays with the platform).
// Level 1 of every kind is the tough board built for 100 seconds (server/puzzles.js).
const PUZZLE_SECONDS = 100;
async function puzzleMatchRound(kind) {
  const q = await puzzleRound(kind, 1);
  return { ...q, seconds: PUZZLE_SECONDS };
}
// The challenge takes any kind except the maze (too easy for 100s with the prize on it).
function challengeRound() {
  const kinds = PUZZLE_KINDS.filter((k) => k !== "maze");
  return puzzleMatchRound(kinds[crypto.randomInt(kinds.length)]);
}

// since: when the first of these players entered the lobby (the 1-minute lobby limit counts from then)
function startMatch({ mode, category, entry, a, b, since = Date.now() }) {
  const id = db.newId();
  const players = [a, b].filter(Boolean).map(({ user, socket }) => ({
    userId: user.id, name: user.name, avatar: user.avatar, socket, bot: false, score: 0, correct: 0, answers: [], strikes: 0,
  }));
  if (mode === "practice") {
    players.push({ userId: "bot", name: "Computer", avatar: "bot", socket: null, bot: true, score: 0, correct: 0, answers: [] });
  }
  // the challenge's "opponent" never plays; it only wins when the puzzle isn't solved in time
  if (mode === "challenge") {
    players.push({ userId: "challenge", name: "Puzzle Challenge", avatar: "bot", socket: null, bot: true, ghost: true, score: 0, correct: 0, answers: [] });
    db.addHouse(entry); // the entry was charged when the player joined the lobby
  }

  // Players stay on the matchmaking screen until this match's questions are ready.
  const m = { id, mode, category, entry, prize: isPaid(mode) ? prizeFor(entry) : 0, players, questions: [], index: -1, phase: "preparing", askedAt: 0, timer: null, done: false };
  matches.set(id, m);
  for (const p of humans(m)) {
    activeByUser.set(p.userId, id);
    p.socket.join(id);
  }
  // other players still waiting in this category get their own research started
  if (categoryWaiting(category)) prefetch(category, QUESTIONS_PER_MATCH);

  const puzzleMatch = mode === "challenge" || PUZZLE_KINDS.includes(category);
  const want = puzzleMatch ? 1 : QUESTIONS_PER_MATCH;
  (puzzleMatch
    ? (mode === "challenge" ? challengeRound() : puzzleMatchRound(category)).then((q) => [q])
    : questionsForMatch(category, want, since + LOBBY_MAX_MS))
    .catch((err) => {
      console.error("[game] could not prepare questions:", err);
      return [];
    })
    .then((questions) => {
      if (m.done) return;
      if (questions.length < want) return cancelMatch(m, "Abhi match shuru nahi ho saka — entry wapas kar di gayi");
      m.questions = questions;
      m.phase = "countdown";
      for (const p of humans(m)) sendFound(m, p);
      m.timer = setTimeout(() => ask(m), COUNTDOWN_MS);
    });
}

function sendFound(m, p, resumed = false) {
  const opp = m.players.find((x) => x !== p);
  p.socket?.emit("match:found", {
    matchId: m.id, mode: m.mode, category: categoryName(m.category), entry: m.entry, prize: m.prize,
    total: m.questions.length || QUESTIONS_PER_MATCH, seconds: SECONDS_PER_QUESTION, resumed,
    you: { name: p.name, avatar: p.avatar, score: p.score },
    opponent: { name: opp.name, avatar: opp.avatar, bot: opp.bot, score: opp.score },
    balance: db.getUser(p.userId).balance,
  });
}

// Ends a match that never started and gives every entry back.
function cancelMatch(m, reason) {
  if (m.done) return;
  m.done = true;
  clearTimeout(m.timer);
  if (isPaid(m.mode)) {
    for (const p of humans(m)) db.addTransaction(p.userId, "refund", m.entry, "Match cancel — entry wapas");
    if (m.mode === "challenge") db.addHouse(-m.entry);
  }
  for (const p of humans(m)) {
    clearTimeout(p.graceTimer);
    activeByUser.delete(p.userId);
    p.socket?.leave(m.id);
    p.socket?.emit("match:cancelled", { reason, balance: db.getUser(p.userId).balance });
  }
  matches.delete(m.id);
}

// Each player gets the options in their own random order, so two players can't compare "option B".
function sendQuestion(m, p, secondsLeft) {
  const q = m.questions[m.index];
  if (q.puzzle) {
    p.socket?.emit("match:question", {
      index: m.index, total: m.questions.length, text: "", options: [], seconds: secondsLeft ?? secondsFor(q), puzzle: q.puzzle,
    });
    return;
  }
  p.socket?.emit("match:question", {
    index: m.index, total: m.questions.length, text: q.text, options: p.perm.map((i) => q.options[i]), seconds: secondsLeft ?? secondsFor(q),
  });
}

function ask(m) {
  m.index++;
  if (m.index >= m.questions.length) return finish(m);
  m.phase = "question";
  m.askedAt = Date.now();
  for (const p of humans(m)) {
    p.perm = shuffle([0, 1, 2, 3]);
    sendQuestion(m, p);
  }
  for (const p of m.players) if (p.bot && !p.ghost) scheduleBot(m, p);
  m.timer = setTimeout(() => reveal(m), secondsFor(m.questions[m.index]) * 1000 + GRACE_MS);
}

function scheduleBot(m, bot) {
  const index = m.index;
  const skill = BOT_SKILL[m.mode] ?? BOT_SKILL.practice;
  // bot timings are tuned for a 10s question; longer puzzles stretch them
  const scale = secondsFor(m.questions[index]) / SECONDS_PER_QUESTION;
  const delay = (skill.minMs + Math.random() * (skill.maxMs - skill.minMs)) * scale;
  const q = m.questions[index];
  if (q.puzzle) {
    if (Math.random() >= skill.accuracy) return; // this round the computer doesn't finish in time
    setTimeout(() => {
      if (!m.done && m.index === index) score(m, bot, index, true, null);
    }, (0.3 + Math.random() * 0.6) * secondsFor(q) * 1000);
    return;
  }
  setTimeout(() => {
    if (m.done || m.index !== index) return;
    const right = Math.random() < skill.accuracy;
    const wrongChoices = [0, 1, 2, 3].filter((i) => i !== q.answerIndex);
    record(m, bot, index, right ? q.answerIndex : wrongChoices[crypto.randomInt(3)]);
  }, delay);
}

export function answer(userId, { matchId, index, choice }) {
  const m = matches.get(matchId);
  if (!m || m.done || m.questions[m.index]?.puzzle) return;
  const p = m.players.find((x) => x.userId === userId);
  if (!p || !p.perm) return;
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) return;
  record(m, p, index, p.perm[choice]); // translate the player's on-screen option back to the real one
}

// A puzzle solution from a player. The server checks it against the puzzle's rules; a wrong one can be fixed
// and sent again (up to MAX_TRIES per puzzle).
const MAX_TRIES = 40;
export function solve(userId, { matchId, index, solution }) {
  const m = matches.get(matchId);
  if (!m || m.done || m.phase !== "question" || index !== m.index) return { ok: false };
  const q = m.questions[index];
  const p = m.players.find((x) => x.userId === userId);
  if (!q?.puzzle || !p || p.answers[index]) return { ok: false };
  p.tries = (p.tries || 0) + 1;
  if (p.tries > MAX_TRIES * (index + 1)) return { ok: false, error: "Bohat zyada koshishen" };
  let ok = false;
  try {
    ok = q.check(solution);
  } catch {
    ok = false;
  }
  if (ok) score(m, p, index, true, null);
  return { ok };
}

// `choice` is always the canonical option index here.
function record(m, p, index, choice) {
  score(m, p, index, choice === m.questions[index].answerIndex, choice);
}

function score(m, p, index, correct, choice) {
  if (m.phase !== "question" || index !== m.index || p.answers[index]) return;
  const elapsed = Date.now() - m.askedAt;
  const limit = secondsFor(m.questions[index]) * 1000;
  if (elapsed > limit + GRACE_MS) return;
  const points = correct ? speedPoints(elapsed, limit) : 0;
  p.answers[index] = { choice, correct, points, ms: elapsed, limit };
  p.score += points;
  if (correct) p.correct++;
  for (const other of m.players) if (other !== p) other.socket?.emit("match:opponentAnswered", { index });
  revealIfDone(m);
}

export function speedPoints(ms, limit = SECONDS_PER_QUESTION * 1000) {
  const full = limit * FULL_POINTS_SHARE;
  if (ms <= full) return MAX_POINTS;
  const t = Math.min(1, (ms - full) / (limit - full));
  return Math.round(MAX_POINTS - (MAX_POINTS - MIN_POINTS) * t);
}

function revealIfDone(m) {
  if (m.phase === "question" && m.players.every((x) => x.ghost || x.answers[m.index] || (!x.bot && !x.socket?.connected))) {
    clearTimeout(m.timer);
    reveal(m);
  }
}

function reveal(m) {
  if (m.done || m.phase !== "question") return;
  m.phase = "reveal";
  const i = m.index;
  const q = m.questions[i];
  for (const p of humans(m)) {
    const opp = m.players.find((x) => x !== p);
    const mine = (canonical) => (canonical == null ? null : p.perm.indexOf(canonical));
    p.socket?.emit("match:reveal", {
      index: i,
      answerIndex: q.puzzle ? null : mine(q.answerIndex),
      solution: q.puzzle ? q.solution : undefined,
      you: { choice: mine(p.answers[i]?.choice), points: p.answers[i]?.points ?? 0, score: p.score },
      opponent: { choice: mine(opp.answers[i]?.choice), points: opp.answers[i]?.points ?? 0, score: opp.score },
    });
  }
  m.timer = setTimeout(() => ask(m), q.puzzle ? PUZZLE_REVEAL_MS : REVEAL_MS);
}

// opts.winner: force a winner (forfeit). opts.void: nobody wins, every entry is refunded.
function finish(m, opts = {}) {
  if (m.done) return;
  m.done = true;
  clearTimeout(m.timer);
  clearTimeout(m.cheatTimer);
  const [a, b] = m.players;
  // challenge: solved (any points) beats the ghost; otherwise the ghost "wins" and the platform keeps the entry
  const byScore = m.mode === "challenge" ? (a.score > 0 ? a : b) : a.score === b.score ? null : a.score > b.score ? a : b;
  const winner = opts.void || opts.nobodyWins ? null : opts.winner ?? byScore;
  const patterns = new Map(humans(m).map((p) => [p, checkPatterns(m, p)]));
  const holdReasons = winner && !winner.bot && isPaid(m.mode) ? (patterns.get(winner) || []).filter((r) => r.hold).map((r) => r.reason) : [];
  const held = holdReasons.length > 0;

  if (isPaid(m.mode)) {
    if (winner && !winner.bot && held) {
      const f = db.holdPrize({ userId: winner.userId, matchId: m.id, amount: m.prize, house: m.mode === "challenge", reasons: holdReasons });
      console.warn(`[anti-cheat] prize Rs ${m.prize} held for review (${f.id}): ${winner.name} — ${holdReasons.join("; ")}`);
    } else if (winner && !winner.bot) {
      db.addTransaction(winner.userId, "prize", m.prize, `Match jeeta vs ${m.players.find((x) => x !== winner).name}`);
      if (m.mode === "challenge") db.addHouse(-m.prize);
    } else if (opts.nobodyWins) {
      // both players broke the rules: both lose, the platform keeps the entries
      if (m.mode === "paid") db.addForfeited(m.entry * humans(m).length);
    } else if (!winner) {
      const note = opts.void ? "Match void — entry wapas" : "Match draw — entry wapas";
      for (const p of humans(m)) db.addTransaction(p.userId, "refund", m.entry, note);
      if (m.mode === "challenge") db.addHouse(-m.entry);
    }
    for (const p of humans(m)) {
      const outcome = opts.nobodyWins ? "loss" : !winner ? "draw" : p === winner ? "win" : "loss";
      // a held prize counts as a win, but the earnings only change when it is released
      db.applyResult(p.userId, outcome, p === winner ? (held ? -m.entry : m.prize - m.entry) : outcome === "loss" ? -m.entry : 0);
    }
  }
  for (const p of humans(m)) db.markSeen(p.userId, m.questions.map((q) => q.id));

  db.recordMatch({
    id: m.id, mode: m.mode, category: m.category, entry: m.entry, prize: m.prize, at: Date.now(),
    winner: winner?.userId ?? null, forfeit: opts.forfeit ?? null, void: !!opts.void,
    players: m.players.map((p) => ({ userId: p.userId, name: p.name, score: p.score, correct: p.correct, strikes: p.strikes ?? 0 })),
  });

  for (const p of humans(m)) {
    clearTimeout(p.graceTimer);
    activeByUser.delete(p.userId);
    if (!p.socket) continue;
    const opp = m.players.find((x) => x !== p);
    p.socket.leave(m.id);
    p.socket.emit("match:end", {
      mode: m.mode,
      outcome: opts.nobodyWins ? "loss" : !winner ? "draw" : p === winner ? "win" : "loss",
      prize: m.prize,
      entry: m.entry,
      rake: RAKE,
      held: held && p === winner,
      you: { score: p.score, correct: p.correct },
      opponent: { name: opp.name, score: opp.score, correct: opp.correct },
      total: m.questions.length,
      balance: db.getUser(p.userId).balance,
      forfeit: opts.forfeit ? { by: opts.forfeit.userId === "both" ? "both" : opts.forfeit.userId === p.userId ? "you" : "opponent", reason: opts.forfeit.reason } : null,
      void: !!opts.void,
    });
  }
  matches.delete(m.id);
}

function forfeit(m, loser, reason) {
  if (m.done) return;
  const winner = m.players.find((x) => x !== loser);
  console.log(`[game] ${loser.name} forfeits match ${m.id} (${reason})`);
  finish(m, { winner, forfeit: { userId: loser.userId, reason } });
}

// ---------- disconnects ----------

// Leaving is never refunded. A dropped player gets RECONNECT_MS to come back (a refresh counts);
// otherwise: alone in the lobby = entry forfeited, in a match = they lose and the opponent wins,
// everyone gone = everyone loses and nobody is paid.
export function handleDisconnect(userId) {
  const waiting = [...queues.values()].flat().find((w) => w.userId === userId);
  if (waiting) {
    clearTimeout(waiting.graceTimer);
    waiting.graceTimer = setTimeout(() => {
      if (waiting.socket.connected) return;
      leaveQueue(userId);
      db.addForfeited(waiting.entry);
      db.flag({ type: "left-lobby", userId, reason: "left the lobby before a match started" });
      console.log(`[game] ${userId} left the lobby — entry Rs ${waiting.entry} forfeited`);
    }, RECONNECT_MS);
    return;
  }
  const m = matches.get(activeByUser.get(userId));
  if (!m || m.done) return;
  const p = m.players.find((x) => x.userId === userId);
  if (p.graceTimer) return;
  for (const other of humans(m)) if (other !== p) other.socket?.emit("match:opponentLeft", { seconds: RECONNECT_MS / 1000 });
  p.graceTimer = setTimeout(() => {
    p.graceTimer = null;
    if (m.done || p.socket?.connected) return;
    if (humans(m).length > 1 && humans(m).every((h) => !h.socket?.connected)) finish(m, { nobodyWins: true, forfeit: { userId: "both", reason: "left" } });
    else forfeit(m, p, "left");
  }, RECONNECT_MS);
  revealIfDone(m);
}

// A player who refreshed or reconnected within the grace period continues where they were.
export function rejoin(userId, socket) {
  const waiting = [...queues.values()].flat().find((w) => w.userId === userId);
  if (waiting) {
    clearTimeout(waiting.graceTimer);
    waiting.socket = socket;
    socket.emit("queue:resume", { category: waiting.category, entry: waiting.entry, prize: prizeFor(waiting.entry), since: waiting.since });
    return true;
  }
  const m = matches.get(activeByUser.get(userId));
  if (!m) return false;
  const p = m.players.find((x) => x.userId === userId);
  clearTimeout(p.graceTimer);
  p.graceTimer = null;
  p.socket = socket;
  socket.join(m.id);
  if (m.phase === "preparing") return true; // they get match:found when the questions are ready
  for (const other of humans(m)) if (other !== p) other.socket?.emit("match:opponentBack");
  sendFound(m, p, true);
  if (m.phase === "question" && !p.answers[m.index]) {
    const left = Math.max(1, Math.ceil(secondsFor(m.questions[m.index]) - (Date.now() - m.askedAt) / 1000));
    sendQuestion(m, p, left);
  }
  return true;
}

// ---------- anti-cheat ----------

// Cheat signals come from the client: tab or window switch, leaving fullscreen, devtools, injected
// extension elements. ANY detection during the match means that player loses. Signals from both
// players within CHEAT_WINDOW_MS = both lose and nobody is paid. Every signal is logged.
const CHEAT_WINDOW_MS = 1500;
export function strike(userId, { matchId, reason }) {
  const m = matches.get(matchId);
  if (!m || m.done || m.phase === "preparing") return;
  const p = m.players.find((x) => x.userId === userId);
  if (!p || p.bot || p.cheated) return;
  p.cheated = String(reason || "unknown").slice(0, 80);
  p.strikes++;
  db.flag({ type: "cheat", userId, matchId, reason: p.cheated, question: m.index });
  console.warn(`[anti-cheat] ${p.name} caught: ${p.cheated}`);
  if (!m.cheatTimer) m.cheatTimer = setTimeout(() => resolveCheat(m), CHEAT_WINDOW_MS);
}

function resolveCheat(m) {
  if (m.done) return;
  const cheaters = humans(m).filter((p) => p.cheated);
  if (cheaters.length > 1) finish(m, { nobodyWins: true, forfeit: { userId: "both", reason: "cheating" } });
  else if (cheaters.length === 1) forfeit(m, cheaters[0], "cheating");
}

const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const stdev = (xs) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)));

// Server-side pattern checks after every match. Every finding is logged as a flag. Findings marked
// `hold` stop an automatic payout: the winner's prize waits for a manual review instead.
function checkPatterns(m, p) {
  const answered = p.answers.filter((a) => a && !a.voided && typeof a.ms === "number");
  if (answered.length < 6) return [];
  const times = answered.map((a) => a.ms);
  const correct = answered.filter((a) => a.correct);
  const reasons = [];
  // nearly all right while nearly always answering late = looking answers up somewhere else
  const late = correct.filter((a) => a.ms > LATE_SHARE * (a.limit ?? SECONDS_PER_QUESTION * 1000)).length;
  if (correct.length >= 8 && late >= 0.75 * correct.length)
    reasons.push({ hold: true, reason: `late-correct: ${correct.length}/${answered.length} right, ${late} of them in the last ${Math.round((1 - LATE_SHARE) * 100)}% of the time` });
  const sd = stdev(times);
  if (sd < 250) reasons.push({ hold: true, reason: `uniform-timing: answer times vary by only ${Math.round(sd)}ms` });
  const fast = correct.filter((a) => a.ms < 1500).length;
  if (fast >= 5) reasons.push({ hold: false, reason: `too-fast: ${fast} right answers in under 1.5s` });
  const history = db.recordTiming(p.userId, mean(times));
  if (history.length >= 3) {
    const last = history.slice(-3);
    if (Math.max(...last) - Math.min(...last) < 120)
      reasons.push({ hold: true, reason: `identical-timing-across-matches: last 3 averages ${last.join("/")}ms` });
  }
  for (const { reason } of reasons) {
    db.flag({ type: "pattern", userId: p.userId, matchId: m.id, reason });
    console.warn(`[anti-cheat] ${p.name}: ${reason}`);
  }
  return reasons;
}

function categoryName(id) {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

export function liveCounts() {
  let playing = 0;
  for (const m of matches.values()) playing += humans(m).length;
  let searching = 0;
  for (const q of queues.values()) searching += q.length;
  return { playing, searching };
}
