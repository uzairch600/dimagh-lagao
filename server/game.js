// Matchmaking and live 1v1 matches. The server owns the clock and the answer key:
// clients never see the correct answer until both players have answered (or time runs out).
import * as db from "./db.js";
import { CATEGORIES, pickQuestions } from "./questions.js";

export const QUESTIONS_PER_MATCH = 10;
export const SECONDS_PER_QUESTION = 10;
export const RAKE = 0.1; // platform share of the pot
export const ENTRY_TIERS = [20, 50, 100, 500];
const GRACE_MS = 600; // network allowance on the answer deadline
const REVEAL_MS = 1800;
const COUNTDOWN_MS = 3500;

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

// ---------- matchmaking ----------

export function joinQueue(socket, user, { category, entry }) {
  if (!CATEGORIES.some((c) => c.id === category)) return { error: "Category nahi mili" };
  if (!ENTRY_TIERS.includes(entry)) return { error: "Ghalat entry fee" };
  if (activeByUser.has(user.id)) return { error: "Aap pehle se match mein hain" };
  if (user.balance < entry) return { error: "Balance kam hai — pehle paise add karein" };

  const key = `${category}:${entry}`;
  const q = queues.get(key) || [];
  const oppIndex = q.findIndex((w) => w.userId !== user.id && w.socket.connected);
  if (oppIndex >= 0) {
    const [opp] = q.splice(oppIndex, 1);
    const oppUser = db.getUser(opp.userId);
    if (oppUser.balance >= entry) {
      startMatch({ mode: "paid", category, entry, a: { user: oppUser, socket: opp.socket }, b: { user, socket } });
      return { ok: true };
    }
    activeByUser.delete(opp.userId);
    opp.socket.emit("queue:cancelled", { reason: "Balance kam hai" });
  }
  q.push({ userId: user.id, socket });
  queues.set(key, q);
  activeByUser.set(user.id, "queue");
  return { ok: true, waiting: true };
}

export function leaveQueue(userId) {
  for (const [key, q] of queues) {
    const i = q.findIndex((w) => w.userId === userId);
    if (i >= 0) q.splice(i, 1);
    if (!q.length) queues.delete(key);
  }
  if (activeByUser.get(userId) === "queue") activeByUser.delete(userId);
}

export function startPractice(socket, user, { category }) {
  if (!CATEGORIES.some((c) => c.id === category)) return { error: "Category nahi mili" };
  if (activeByUser.has(user.id)) return { error: "Aap pehle se match mein hain" };
  startMatch({ mode: "practice", category, entry: 0, a: { user, socket }, b: null });
  return { ok: true };
}

// "House" match: no real opponent showed up, so the app itself stakes the other side against a
// computer player. The computer is always shown as "Computer" — never disguised as a person —
// and plays at a fixed, published strength.
export function startHouse(socket, user, { category, entry }) {
  if (!CATEGORIES.some((c) => c.id === category)) return { error: "Category nahi mili" };
  if (!ENTRY_TIERS.includes(entry) || entry > HOUSE_MAX_ENTRY) return { error: "Computer ke saath ye entry nahi chal sakti" };
  if (activeByUser.has(user.id) && activeByUser.get(user.id) !== "queue") return { error: "Aap pehle se match mein hain" };
  if (user.balance < entry) return { error: "Balance kam hai — pehle paise add karein" };
  leaveQueue(user.id);
  startMatch({ mode: "house", category, entry, a: { user, socket }, b: null });
  return { ok: true };
}

// ---------- match lifecycle ----------

export const HOUSE_MAX_ENTRY = Number(process.env.HOUSE_MAX_ENTRY || 100);
export const HOUSE_WAIT_SECONDS = 30; // how long a player searches before the app plays them itself
const BOT_SKILL = {
  practice: { accuracy: 0.6, minMs: 2000, maxMs: 8000 },
  house: { accuracy: Number(process.env.HOUSE_BOT_ACCURACY || 0.65), minMs: 2500, maxMs: 7000 },
};
const isPaid = (mode) => mode === "paid" || mode === "house";

function startMatch({ mode, category, entry, a, b }) {
  const id = db.newId();
  const players = [a, b].filter(Boolean).map(({ user, socket }) => ({
    userId: user.id, name: user.name, avatar: user.avatar, socket, bot: false, score: 0, correct: 0, answers: [],
  }));
  if (mode === "practice" || mode === "house") {
    players.push({ userId: "bot", name: "Computer", avatar: "bot", socket: null, bot: true, score: 0, correct: 0, answers: [] });
  }

  const seen = players.filter((p) => !p.bot).map((p) => db.seenSet(p.userId));
  const questions = pickQuestions(category, QUESTIONS_PER_MATCH, seen);

  if (isPaid(mode)) {
    for (const p of players) if (!p.bot) db.addTransaction(p.userId, "entry", -entry, `Match entry (${categoryName(category)})`);
    if (mode === "house") db.addHouse(entry);
  }

  const m = { id, mode, category, entry, prize: isPaid(mode) ? prizeFor(entry) : 0, players, questions, index: -1, phase: "countdown", askedAt: 0, timer: null, done: false };
  matches.set(id, m);
  for (const p of players) {
    if (p.bot) continue;
    activeByUser.set(p.userId, id);
    p.socket.join(id);
  }

  for (const p of players) {
    if (p.bot) continue;
    const opp = players.find((x) => x !== p);
    p.socket.emit("match:found", {
      matchId: id, mode, category: categoryName(category), entry, prize: m.prize,
      total: questions.length, seconds: SECONDS_PER_QUESTION,
      you: { name: p.name, avatar: p.avatar },
      opponent: { name: opp.name, avatar: opp.avatar, bot: opp.bot },
      balance: db.getUser(p.userId).balance,
    });
  }
  m.timer = setTimeout(() => ask(m), COUNTDOWN_MS);
}

function ask(m) {
  m.index++;
  if (m.index >= m.questions.length) return finish(m);
  const q = m.questions[m.index];
  m.phase = "question";
  m.askedAt = Date.now();
  io.to(m.id).emit("match:question", {
    index: m.index, total: m.questions.length, text: q.text, options: q.options, seconds: SECONDS_PER_QUESTION,
  });
  for (const p of m.players) if (p.bot) scheduleBot(m, p);
  m.timer = setTimeout(() => reveal(m), SECONDS_PER_QUESTION * 1000 + GRACE_MS);
}

function scheduleBot(m, bot) {
  const index = m.index;
  const skill = BOT_SKILL[m.mode] ?? BOT_SKILL.practice;
  const delay = skill.minMs + Math.random() * (skill.maxMs - skill.minMs);
  setTimeout(() => {
    if (m.done || m.index !== index) return;
    const q = m.questions[index];
    const right = Math.random() < skill.accuracy;
    const wrongChoices = q.options.map((_, i) => i).filter((i) => i !== q.answerIndex);
    record(m, bot, index, right ? q.answerIndex : wrongChoices[Math.floor(Math.random() * 3)]);
  }, delay);
}

export function answer(userId, { matchId, index, choice }) {
  const m = matches.get(matchId);
  if (!m || m.done) return;
  const p = m.players.find((x) => x.userId === userId);
  if (!p) return;
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) return;
  record(m, p, index, choice);
}

function record(m, p, index, choice) {
  if (m.phase !== "question" || index !== m.index || p.answers[index]) return;
  const elapsed = Date.now() - m.askedAt;
  const limit = SECONDS_PER_QUESTION * 1000;
  if (elapsed > limit + GRACE_MS) return;
  const correct = choice === m.questions[index].answerIndex;
  // 100 for a right answer + up to 100 speed bonus, so faster *and* right wins.
  const points = correct ? 100 + Math.round(100 * Math.max(0, 1 - elapsed / limit)) : 0;
  p.answers[index] = { choice, correct, points, ms: elapsed };
  p.score += points;
  if (correct) p.correct++;

  for (const other of m.players) {
    if (other !== p && other.socket) other.socket.emit("match:opponentAnswered", { index });
  }
  if (m.players.every((x) => x.answers[index] || (x.socket && !x.socket.connected))) {
    clearTimeout(m.timer);
    reveal(m);
  }
}

function reveal(m) {
  if (m.done || m.phase !== "question") return;
  m.phase = "reveal";
  const i = m.index;
  const q = m.questions[i];
  for (const p of m.players) {
    if (p.bot || !p.socket) continue;
    const opp = m.players.find((x) => x !== p);
    p.socket.emit("match:reveal", {
      index: i,
      answerIndex: q.answerIndex,
      you: { choice: p.answers[i]?.choice ?? null, points: p.answers[i]?.points ?? 0, score: p.score },
      opponent: { choice: opp.answers[i]?.choice ?? null, points: opp.answers[i]?.points ?? 0, score: opp.score },
    });
  }
  m.timer = setTimeout(() => ask(m), REVEAL_MS);
}

function finish(m) {
  if (m.done) return;
  m.done = true;
  clearTimeout(m.timer);
  const [a, b] = m.players;
  const winner = a.score === b.score ? null : a.score > b.score ? a : b;

  if (isPaid(m.mode)) {
    if (winner && !winner.bot) {
      db.addTransaction(winner.userId, "prize", m.prize, `Match jeeta vs ${m.players.find((x) => x !== winner).name}`);
      if (m.mode === "house") db.addHouse(-m.prize);
    } else if (!winner) {
      for (const p of m.players) if (!p.bot) db.addTransaction(p.userId, "refund", m.entry, "Match draw — entry wapas");
      if (m.mode === "house") db.addHouse(-m.entry);
    }
    for (const p of m.players) {
      if (p.bot) continue;
      const outcome = !winner ? "draw" : p === winner ? "win" : "loss";
      db.applyResult(p.userId, outcome, p === winner ? m.prize - m.entry : outcome === "loss" ? -m.entry : 0);
    }
  }
  for (const p of m.players) if (!p.bot) db.markSeen(p.userId, m.questions.map((q) => q.id));

  db.recordMatch({
    id: m.id, mode: m.mode, category: m.category, entry: m.entry, prize: m.prize, at: Date.now(),
    winner: winner?.userId ?? null,
    players: m.players.map((p) => ({ userId: p.userId, name: p.name, score: p.score, correct: p.correct })),
  });

  for (const p of m.players) {
    if (p.bot) continue;
    activeByUser.delete(p.userId);
    if (!p.socket) continue;
    const opp = m.players.find((x) => x !== p);
    p.socket.leave(m.id);
    p.socket.emit("match:end", {
      mode: m.mode,
      outcome: !winner ? "draw" : p === winner ? "win" : "loss",
      prize: m.prize,
      entry: m.entry,
      you: { score: p.score, correct: p.correct },
      opponent: { name: opp.name, score: opp.score, correct: opp.correct },
      total: m.questions.length,
      balance: db.getUser(p.userId).balance,
    });
  }
  matches.delete(m.id);
}

// A disconnected player keeps their seat (they may reconnect); unanswered questions just score 0.
export function handleDisconnect(userId) {
  leaveQueue(userId);
  const matchId = activeByUser.get(userId);
  const m = matchId && matches.get(matchId);
  if (!m) return;
  // Against the computer the match always plays out in full, so leaving early can't lock in a lead.
  if (m.mode === "paid" && m.players.every((p) => !p.socket.connected)) return finish(m);
  if (m.phase === "question" && m.players.every((x) => x.answers[m.index] || (!x.bot && !x.socket.connected))) {
    clearTimeout(m.timer);
    reveal(m);
  }
}

// Lets a player who refreshed the page continue the same match.
export function rejoin(userId, socket) {
  const matchId = activeByUser.get(userId);
  const m = matchId && matches.get(matchId);
  if (!m) return false;
  const p = m.players.find((x) => x.userId === userId);
  p.socket = socket;
  socket.join(m.id);
  const opp = m.players.find((x) => x !== p);
  socket.emit("match:found", {
    matchId: m.id, mode: m.mode, category: categoryName(m.category), entry: m.entry, prize: m.prize,
    total: m.questions.length, seconds: SECONDS_PER_QUESTION, resumed: true,
    you: { name: p.name, avatar: p.avatar, score: p.score },
    opponent: { name: opp.name, avatar: opp.avatar, bot: opp.bot, score: opp.score },
    balance: db.getUser(userId).balance,
  });
  return true;
}

function categoryName(id) {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

export function liveCounts() {
  let playing = 0;
  for (const m of matches.values()) playing += m.players.filter((p) => !p.bot).length;
  let searching = 0;
  for (const q of queues.values()) searching += q.length;
  return { playing, searching };
}
