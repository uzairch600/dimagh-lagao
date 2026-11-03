// Matchmaking and live matches. Everything is free: no entry fees, no prizes, no money of any kind.
// The server owns the clock and the answer key: clients never see the correct answer until both players have answered
// (or time runs out).
//
//   free     - a quiz 1v1 between two real players
//   practice - a quiz against the computer (when no other player came), or a puzzle played alone
import crypto from "node:crypto";
import * as db from "./db.js";
import { CATEGORIES, questionsForMatch } from "./questions.js";
import { PUZZLE_KINDS, puzzleRound } from "./puzzles.js";

export const QUESTIONS_PER_MATCH = 10;
// 10s: enough to read a hard question and four options on a phone, too short to ask an AI on a second
// phone and still score well (that takes 8-10s, which speed scoring turns into ~10-20 points).
export const SECONDS_PER_QUESTION = 10;
// Speed scoring: a right answer within the first FULL_POINTS_SHARE of the time earns MAX_POINTS (2s of a 10s
// question), then falls linearly to MIN_POINTS at the last second. A wrong answer earns 0.
export const MAX_POINTS = 100;
export const MIN_POINTS = 10;
export const FULL_POINTS_SHARE = 0.2;
// Most questions get SECONDS_PER_QUESTION; a puzzle carries its own time, set by how hard it is.
const secondsFor = (q) => q.seconds ?? SECONDS_PER_QUESTION;
export const OPPONENT_WAIT_SECONDS = 30; // a quiz player waits this long for a real opponent, then the computer plays
const GRACE_MS = 600; // network allowance on the answer deadline
const REVEAL_MS = 1800;
const PUZZLE_REVEAL_MS = 4000; // time to look at the solution
const COUNTDOWN_MS = 3500;
const RECONNECT_MS = 10_000; // a dropped player has this long to come back before forfeiting
const BOT_SKILL = { accuracy: 0.6, minMs: 2000, maxMs: 8500 };

const queues = new Map(); // category -> [{ userId, socket, since, category }]
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

// A puzzle starts at once, played alone. A quiz looks for another player first (a 1v1); if nobody comes within
// OPPONENT_WAIT_SECONDS, the computer plays instead.
export function play(socket, user, { category }) {
  if (!CATEGORIES.some((c) => c.id === category)) return { error: "Category nahi mili" };
  if (activeByUser.has(user.id)) return { error: "Aap pehle se match mein hain" };
  if (PUZZLE_KINDS.includes(category)) {
    startMatch({ mode: "practice", category, a: { user, socket }, b: null });
    return { ok: true };
  }
  const q = queues.get(category) || [];
  const oppIndex = q.findIndex((w) => w.userId !== user.id && w.socket.connected);
  if (oppIndex >= 0) {
    const [opp] = q.splice(oppIndex, 1);
    if (!q.length) queues.delete(category);
    clearTimeout(opp.botTimer);
    startMatch({ mode: "free", category, a: { user: db.getUser(opp.userId), socket: opp.socket }, b: { user, socket } });
    return { ok: true };
  }
  const waiting = { userId: user.id, socket, since: Date.now(), category };
  q.push(waiting);
  queues.set(category, q);
  activeByUser.set(user.id, "queue");
  waiting.botTimer = setTimeout(() => {
    if (!(queues.get(category) || []).includes(waiting)) return;
    leaveQueue(user.id);
    startMatch({ mode: "practice", category, a: { user: db.getUser(user.id), socket: waiting.socket }, b: null });
  }, OPPONENT_WAIT_SECONDS * 1000);
  return { ok: true, waiting: true };
}

export function leaveQueue(userId) {
  for (const [key, q] of queues) {
    const i = q.findIndex((w) => w.userId === userId);
    if (i >= 0) clearTimeout(q.splice(i, 1)[0].botTimer);
    if (!q.length) queues.delete(key);
  }
  if (activeByUser.get(userId) === "queue") activeByUser.delete(userId);
}

// ---------- match lifecycle ----------

function startMatch({ mode, category, a, b }) {
  const id = db.newId();
  const players = [a, b].filter(Boolean).map(({ user, socket }) => ({
    userId: user.id, name: user.name, avatar: user.avatar, socket, bot: false, score: 0, correct: 0, answers: [], strikes: 0,
  }));
  // A puzzle is played alone: the "opponent" is a ghost that never plays and only "wins" when the puzzle isn't
  // solved in time. A quiz without a second player gets the computer.
  const puzzle = PUZZLE_KINDS.includes(category);
  if (puzzle) players.push({ userId: "ghost", name: "Puzzle", avatar: "bot", socket: null, bot: true, ghost: true, score: 0, correct: 0, answers: [] });
  else if (players.length === 1) players.push({ userId: "bot", name: "Computer", avatar: "bot", socket: null, bot: true, score: 0, correct: 0, answers: [] });

  // Players stay on the matchmaking screen until this match's questions are ready.
  const m = { id, mode, category, players, questions: [], index: -1, phase: "preparing", askedAt: 0, timer: null, done: false };
  matches.set(id, m);
  for (const p of humans(m)) {
    activeByUser.set(p.userId, id);
    p.socket.join(id);
  }

  const want = puzzle ? 1 : QUESTIONS_PER_MATCH;
  (puzzle ? puzzleRound(category, 1).then((q) => [q]) : Promise.resolve(questionsForMatch(category, want)))
    .catch((err) => {
      console.error("[game] could not prepare questions:", err);
      return [];
    })
    .then((questions) => {
      if (m.done) return;
      if (questions.length < want) return cancelMatch(m, "Abhi match shuru nahi ho saka — thori der baad dobara try karein");
      m.questions = questions;
      m.phase = "countdown";
      for (const p of humans(m)) sendFound(m, p);
      m.timer = setTimeout(() => ask(m), COUNTDOWN_MS);
    });
}

function sendFound(m, p, resumed = false) {
  const opp = m.players.find((x) => x !== p);
  p.socket?.emit("match:found", {
    matchId: m.id, mode: m.mode, category: categoryName(m.category),
    total: m.questions.length || QUESTIONS_PER_MATCH, seconds: SECONDS_PER_QUESTION, resumed, solo: !!opp.ghost,
    you: { name: p.name, avatar: p.avatar, score: p.score },
    opponent: { name: opp.name, avatar: opp.avatar, bot: opp.bot, score: opp.score },
  });
}

// Ends a match that never finished, without a result.
function cancelMatch(m, reason) {
  if (m.done) return;
  m.done = true;
  clearTimeout(m.timer);
  for (const p of humans(m)) {
    clearTimeout(p.graceTimer);
    activeByUser.delete(p.userId);
    p.socket?.leave(m.id);
    p.socket?.emit("match:cancelled", { reason });
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
  const q = m.questions[index];
  const delay = BOT_SKILL.minMs + Math.random() * (BOT_SKILL.maxMs - BOT_SKILL.minMs);
  setTimeout(() => {
    if (m.done || m.index !== index) return;
    const right = Math.random() < BOT_SKILL.accuracy;
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
// and sent again (up to MAX_TRIES).
const MAX_TRIES = 40;
export function solve(userId, { matchId, index, solution }) {
  const m = matches.get(matchId);
  if (!m) return { ok: false, gone: true }; // the match no longer exists on this server
  if (m.done || m.phase !== "question" || index !== m.index) return { ok: false };
  const q = m.questions[index];
  const p = m.players.find((x) => x.userId === userId);
  if (!q?.puzzle || !p || p.answers[index]) return { ok: false };
  p.tries = (p.tries || 0) + 1;
  if (p.tries > MAX_TRIES) return { ok: false, error: "Bohat zyada koshishen" };
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

// opts.winner: force a winner (forfeit). opts.nobodyWins: both players broke the rules.
function finish(m, opts = {}) {
  if (m.done) return;
  m.done = true;
  clearTimeout(m.timer);
  clearTimeout(m.cheatTimer);
  const [a, b] = m.players;
  // a puzzle: solved (any points) beats the ghost
  const solo = m.players.some((p) => p.ghost);
  const byScore = solo ? (a.score > 0 ? a : b) : a.score === b.score ? null : a.score > b.score ? a : b;
  const winner = opts.nobodyWins ? null : opts.winner ?? byScore;
  const outcomeFor = (p) => (opts.nobodyWins ? "loss" : !winner ? "draw" : p === winner ? "win" : "loss");

  // The leaderboard counts wins against real players and solved puzzles (not wins against the computer).
  if (m.mode === "free") {
    for (const p of humans(m)) {
      checkPatterns(m, p);
      db.applyResult(p.userId, outcomeFor(p));
    }
  } else if (solo && winner && !winner.bot) {
    db.addPuzzleSolved(winner.userId);
  }
  for (const p of humans(m)) db.markSeen(p.userId, m.questions.map((q) => q.id));

  db.recordMatch({
    id: m.id, mode: m.mode, category: m.category, at: Date.now(),
    winner: winner?.userId ?? null, forfeit: opts.forfeit ?? null,
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
      outcome: outcomeFor(p),
      you: { score: p.score, correct: p.correct },
      opponent: { name: opp.name, score: opp.score, correct: opp.correct },
      total: m.questions.length,
      solo: !!opp.ghost,
      forfeit: opts.forfeit ? { by: opts.forfeit.userId === "both" ? "both" : opts.forfeit.userId === p.userId ? "you" : "opponent", reason: opts.forfeit.reason } : null,
    });
  }
  matches.delete(m.id);
}

// The player pressed Quit in a match and confirmed: they lose at once (in a 1v1 the opponent wins).
export function quit(userId, { matchId }) {
  const m = matches.get(matchId);
  const p = m?.players.find((x) => x.userId === userId);
  if (!m || m.done || !p) return { ok: false };
  clearTimeout(p.graceTimer);
  forfeit(m, p, "quit");
  return { ok: true };
}

function forfeit(m, loser, reason) {
  if (m.done) return;
  const winner = m.players.find((x) => x !== loser);
  console.log(`[game] ${loser.name} forfeits match ${m.id} (${reason})`);
  finish(m, { winner, forfeit: { userId: loser.userId, reason } });
}

// ---------- disconnects ----------

// A dropped player gets RECONNECT_MS to come back (a refresh counts); otherwise: in the lobby they leave it, in a
// match they lose and the opponent wins, everyone gone = everyone loses.
export function handleDisconnect(userId) {
  const waiting = [...queues.values()].flat().find((w) => w.userId === userId);
  if (waiting) {
    clearTimeout(waiting.graceTimer);
    waiting.graceTimer = setTimeout(() => {
      if (!waiting.socket.connected) leaveQueue(userId);
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

// The server is about to stop (Render sends SIGTERM on every deploy and before a free instance sleeps). Matches live
// only in memory, so end every unfinished one now and tell the players.
export function shutdown(reason) {
  for (const [key, q] of queues) {
    for (const w of q) {
      activeByUser.delete(w.userId);
      clearTimeout(w.botTimer);
      w.socket.emit("queue:cancelled", { reason });
    }
    queues.delete(key);
  }
  for (const m of [...matches.values()]) if (!m.done) cancelMatch(m, reason);
}

// A player who refreshed or reconnected within the grace period continues where they were.
// false: this player has no lobby place or match on this server (e.g. it restarted), so the client stops waiting on one
export function rejoin(userId, socket) {
  const waiting = [...queues.values()].flat().find((w) => w.userId === userId);
  if (waiting) {
    clearTimeout(waiting.graceTimer);
    waiting.socket = socket;
    socket.emit("queue:resume", { category: waiting.category, since: waiting.since });
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
// extension elements. ANY detection during a match means that player loses. Signals from both
// players within CHEAT_WINDOW_MS = both lose. Every signal is logged.
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

// Timing checks after every 1v1 against a real player, so leaderboard wins stay honest. Findings are logged as flags.
function checkPatterns(m, p) {
  const answered = p.answers.filter((a) => a && typeof a.ms === "number");
  if (answered.length < 6) return;
  const times = answered.map((a) => a.ms);
  const correct = answered.filter((a) => a.correct);
  const reasons = [];
  // nearly all right while nearly always answering late = looking answers up somewhere else
  const late = correct.filter((a) => a.ms > 0.6 * (a.limit ?? SECONDS_PER_QUESTION * 1000)).length;
  if (correct.length >= 8 && late >= 0.75 * correct.length) reasons.push(`late-correct: ${correct.length}/${answered.length} right, ${late} of them late`);
  const sd = stdev(times);
  if (sd < 250) reasons.push(`uniform-timing: answer times vary by only ${Math.round(sd)}ms`);
  const fast = correct.filter((a) => a.ms < 1500).length;
  if (fast >= 5) reasons.push(`too-fast: ${fast} right answers in under 1.5s`);
  for (const reason of reasons) {
    db.flag({ type: "pattern", userId: p.userId, matchId: m.id, reason });
    console.warn(`[anti-cheat] ${p.name}: ${reason}`);
  }
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
