// REST API + Socket.io realtime layer. Mounted by ../server.js alongside Next.js.
import crypto from "node:crypto";
import express from "express";
import { Server } from "socket.io";
import * as db from "./db.js";
import * as game from "./game.js";
import { CATEGORIES, aiStatus, poolStats, warmUp } from "./questions.js";
import { PUZZLE_SECONDS } from "./puzzles.js";

// Demo mode: "Add money" just credits the wallet so the game can be tested without a payment gateway.
const DEMO_MODE = process.env.DEMO_MODE !== "false";
// Deposits work only in demo mode until the payment gateway (Easypaisa / JazzCash) is connected. While closed, the
// app says paid matches are coming soon and points players to free practice.
const PAYMENTS_OPEN = DEMO_MODE;
const MIN_WITHDRAW = 200;
// Avatar = one of the illustrated animals drawn by components/Avatar.tsx.
const AVATARS = ["fox", "cat", "owl", "bear", "bunny", "penguin", "tiger", "lion"];

const app = express.Router();
app.use(express.json({ limit: "20kb" }));
export const api = app;

// ---------- helpers ----------

const hashPin = (pin, salt = crypto.randomBytes(16).toString("hex")) =>
  salt + ":" + crypto.scryptSync(pin, salt, 32).toString("hex");

function pinMatches(pin, stored) {
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(pin, salt, 32);
  return crypto.timingSafeEqual(test, Buffer.from(hash, "hex"));
}

// Accepts 03xxxxxxxxx, +923xxxxxxxxx, 923xxxxxxxxx -> 03xxxxxxxxx
// Pakistani mobile numbers only: 030x-034x and 0355, and not an obvious fake like 0300-0000000 or 0300-1234567.
function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  const local = digits.startsWith("92") ? "0" + digits.slice(2) : digits;
  if (!/^03([0-4]\d|55)\d{7}$/.test(local)) return null;
  const tail = local.slice(4);
  if (/^(\d)\1{6}$/.test(tail) || tail === "1234567" || tail === "7654321") return null;
  return local;
}

// The visitor's own IP. Render sits behind Cloudflare, so req.ip is the proxy; Cloudflare puts the real one here.
const clientIp = (req) => String(req.headers["cf-connecting-ip"] || req.ip);

// New accounts per network: stops a script from filling the database with made-up numbers. Generous, because many
// phones on a Pakistani mobile network share one IP.
const SIGNUPS_PER_HOUR = 10;
const SIGNUPS_PER_DAY = 30;
const signupTimes = new Map();
function signupAllowed(ip) {
  const now = Date.now();
  const recent = (signupTimes.get(ip) || []).filter((t) => now - t < 24 * 3600_000);
  signupTimes.set(ip, recent);
  return recent.filter((t) => now - t < 3600_000).length < SIGNUPS_PER_HOUR && recent.length < SIGNUPS_PER_DAY;
}

const cleanName = (s) => String(s || "").replace(/[<>]/g, "").trim().slice(0, 18);

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const user = db.findUserByToken(token);
  if (!user) return res.status(401).json({ error: "Dobara login karein" });
  req.user = user;
  next();
}

const config = () => ({
  puzzleSeconds: PUZZLE_SECONDS,
  demoMode: DEMO_MODE,
  paymentsOpen: PAYMENTS_OPEN,
  categories: CATEGORIES,
  tiers: game.ENTRY_TIERS.map((entry) => ({ entry, prize: game.prizeFor(entry) })),
  puzzleTiers: game.PUZZLE_TIERS.map((entry) => ({ entry, prize: game.prizeFor(entry) })),
  challengeMaxEntry: game.CHALLENGE_MAX_ENTRY,
  noOpponentRefundSeconds: game.NO_OPPONENT_REFUND_MS / 1000,
  questions: game.QUESTIONS_PER_MATCH,
  seconds: game.SECONDS_PER_QUESTION,
  rake: game.RAKE,
  scoring: { max: game.MAX_POINTS, min: game.MIN_POINTS, fullMs: game.FULL_POINTS_SHARE * game.SECONDS_PER_QUESTION * 1000 },
  minWithdraw: MIN_WITHDRAW,
  houseWaitSeconds: game.HOUSE_WAIT_SECONDS,
  avatars: AVATARS,
});

// ---------- REST API ----------

app.get("/api/config", (req, res) => res.json(config()));

// Simple brute-force guard on login: 8 tries per phone per 15 minutes.
const loginAttempts = new Map();
app.post("/api/login", (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const pin = String(req.body.pin || "");
  if (!phone) return res.status(400).json({ error: "Sahi mobile number likhein (03xx-xxxxxxx)" });
  if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: "PIN 4 digits ka hona chahiye" });

  const now = Date.now();
  const tries = (loginAttempts.get(phone) || []).filter((t) => now - t < 15 * 60_000);
  if (tries.length >= 8) return res.status(429).json({ error: "Bohat zyada koshishen — 15 minute baad try karein" });

  let user = db.findUserByPhone(phone);
  if (user) {
    if (!pinMatches(pin, user.pinHash)) {
      loginAttempts.set(phone, [...tries, now]);
      return res.status(401).json({ error: "PIN ghalat hai" });
    }
  } else {
    const name = cleanName(req.body.name);
    if (name.length < 2) return res.status(400).json({ error: "Apna naam likhein", needName: true });
    if (!signupAllowed(clientIp(req))) return res.status(429).json({ error: "Is network se abhi bohat naye account ban chuke — thori der baad try karein" });
    signupTimes.get(clientIp(req)).push(Date.now());
    user = db.createUser({ name, phone, avatar: AVATARS[crypto.randomInt(AVATARS.length)], pinHash: hashPin(pin) });
  }
  loginAttempts.delete(phone);
  res.json({ token: user.token, user: db.publicUser(user) });
});

app.post("/api/check-phone", (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ error: "Sahi mobile number likhein (03xx-xxxxxxx)" });
  res.json({ exists: !!db.findUserByPhone(phone) });
});

app.get("/api/me", auth, (req, res) => {
  res.json({ user: db.publicUser(req.user), status: game.status(req.user.id), config: config() });
});

app.post("/api/profile", auth, (req, res) => {
  const name = cleanName(req.body.name);
  const avatar = AVATARS.includes(req.body.avatar) ? req.body.avatar : undefined;
  if (req.body.name !== undefined && name.length < 2) return res.status(400).json({ error: "Naam kam az kam 2 harf" });
  res.json({ user: db.publicUser(db.updateProfile(req.user.id, { name, avatar })) });
});

app.get("/api/wallet", auth, (req, res) => {
  res.json({
    balance: req.user.balance,
    transactions: db.transactionsFor(req.user.id),
    withdrawals: db.withdrawalsFor(req.user.id),
  });
});

app.post("/api/wallet/deposit", auth, (req, res) => {
  if (!PAYMENTS_OPEN) return res.status(400).json({ error: "Paid matches jald aa rahe hain — abhi free practice khelein" });
  const amount = Number(req.body.amount);
  if (![100, 250, 500, 1000].includes(amount)) return res.status(400).json({ error: "Ghalat amount" });
  if (req.user.balance + amount > 10_000) return res.status(400).json({ error: "Demo wallet ki hadd Rs 10,000 hai" });
  db.addTransaction(req.user.id, "deposit", amount, "Demo deposit");
  res.json({ balance: req.user.balance });
});

app.post("/api/wallet/withdraw", auth, (req, res) => {
  const amount = Math.floor(Number(req.body.amount));
  const method = ["easypaisa", "jazzcash", "bank"].includes(req.body.method) ? req.body.method : null;
  const account = String(req.body.account || "").trim().slice(0, 40);
  if (!method) return res.status(400).json({ error: "Payment method chunein" });
  if (account.length < 6) return res.status(400).json({ error: "Account / number likhein" });
  if (!(amount >= MIN_WITHDRAW)) return res.status(400).json({ error: `Kam az kam Rs ${MIN_WITHDRAW} nikal sakte hain` });
  if (amount > req.user.balance) return res.status(400).json({ error: "Balance kam hai" });
  if (game.status(req.user.id) !== "idle") return res.status(400).json({ error: "Match khatam hone ke baad try karein" });
  const w = db.createWithdrawal(req.user.id, amount, method, account);
  res.json({ withdrawal: w, balance: req.user.balance });
});

const contactTimes = new Map(); // ip -> last message time
app.post("/api/contact", (req, res) => {
  const name = cleanName(req.body.name);
  const phone = normalizePhone(req.body.phone);
  const topic = String(req.body.topic || "general").slice(0, 20);
  const message = String(req.body.message || "").trim().slice(0, 2000);
  if (name.length < 2) return res.status(400).json({ error: "Apna naam likhein" });
  if (!phone) return res.status(400).json({ error: "Sahi mobile number likhein (03xx-xxxxxxx)" });
  if (message.length < 10) return res.status(400).json({ error: "Message thora tafseel se likhein" });
  const last = contactTimes.get(clientIp(req)) || 0;
  if (Date.now() - last < 60_000) return res.status(429).json({ error: "Thori der baad dobara bhejein" });
  contactTimes.set(clientIp(req), Date.now());
  db.saveMessage({ name, phone, topic, message });
  res.json({ ok: true });
});

// Real numbers only: people connected right now, players in a match, and the latest winners.
let onlineCount = () => 0;
app.get("/api/live", (req, res) => {
  const startOfDay = new Date().setHours(0, 0, 0, 0);
  res.json({
    online: onlineCount(),
    ...game.liveCounts(),
    paidToday: db.paidOutSince(startOfDay),
    recent: db.recentWins(),
  });
});

app.get("/api/matches", auth, (req, res) => res.json({ matches: db.matchesFor(req.user.id) }));
app.get("/api/leaderboard", (req, res) => res.json({ players: db.leaderboard() }));

// ---------- realtime ----------

export function attachRealtime(httpServer) {
  // destroyUpgrade: false keeps Next.js dev (HMR) websockets on the same server working.
  const io = new Server(httpServer, { destroyUpgrade: false });
  game.attach(io);
  onlineCount = () => io.engine.clientsCount;

  io.use((socket, next) => {
    const user = db.findUserByToken(socket.handshake.auth?.token);
    if (!user) return next(new Error("unauthorized"));
    socket.data.userId = user.id;
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    // nothing to resume (e.g. the server restarted mid-match): tell the client so it doesn't sit on a dead board
    if (!game.rejoin(userId, socket)) socket.emit("session:idle");

    socket.on("queue:join", (payload, cb) => {
      const result = game.joinQueue(socket, db.getUser(userId), { category: payload?.category, entry: Number(payload?.entry) });
      cb?.(result);
    });
    socket.on("queue:leave", (_, cb) => cb?.(game.cancelSearch(userId)));
    socket.on("challenge:start", (payload, cb) => {
      cb?.(game.startChallenge(socket, db.getUser(userId), { category: payload?.category, entry: Number(payload?.entry) }));
    });
    socket.on("practice:start", (payload, cb) => {
      cb?.(game.startPractice(socket, db.getUser(userId), { category: payload?.category }));
    });
    socket.on("match:answer", (payload) => game.answer(userId, payload || {}));
    socket.on("match:strike", (payload) => game.strike(userId, payload || {}));
    socket.on("match:solve", (payload, cb) => cb?.(game.solve(userId, payload || {})));
    socket.on("match:quit", (payload, cb) => cb?.(game.quit(userId, payload || {})));
    socket.on("disconnect", () => game.handleDisconnect(userId));
  });
}

export function startBackground() {
  console.log(`  Demo mode: ${DEMO_MODE ? "ON (paise asli nahi)" : "OFF"}`);
  console.log(`  AI questions: ${aiStatus()}`);
  console.log("  Question pool:", poolStats(), "\n");
  warmUp();
}
