// Tiny JSON-file store. Good enough for the first version; swap for Postgres/Mongo
// before real money goes through it.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const STARTING_BALANCE = 0;
const SEEN_HISTORY = 400; // how many recent question ids we remember per player

fs.mkdirSync(DATA_DIR, { recursive: true });

const empty = () => ({ users: {}, transactions: [], matches: [], withdrawals: [] });

let data = empty();
if (fs.existsSync(DB_FILE)) {
  try {
    data = { ...empty(), ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) };
  } catch (err) {
    console.error("[db] could not read db.json, starting fresh:", err.message);
  }
}

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const tmp = DB_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, DB_FILE);
  }, 300);
}

export const newId = () => crypto.randomBytes(8).toString("hex");

export function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    avatar: u.avatar,
    balance: u.balance,
    wins: u.wins,
    losses: u.losses,
    draws: u.draws,
    earnings: u.earnings,
  };
}

export function findUserByPhone(phone) {
  return Object.values(data.users).find((u) => u.phone === phone) || null;
}

export function findUserByToken(token) {
  if (!token) return null;
  return Object.values(data.users).find((u) => u.token === token) || null;
}

export function getUser(id) {
  return data.users[id] || null;
}

export function createUser({ name, phone, avatar, pinHash }) {
  const u = {
    id: newId(),
    token: crypto.randomBytes(24).toString("hex"),
    name,
    phone,
    pinHash,
    avatar,
    balance: STARTING_BALANCE,
    wins: 0,
    losses: 0,
    draws: 0,
    earnings: 0,
    seen: [],
    createdAt: Date.now(),
  };
  data.users[u.id] = u;
  save();
  return u;
}

export function updateProfile(userId, { name, avatar }) {
  const u = data.users[userId];
  if (name) u.name = name;
  if (avatar) u.avatar = avatar;
  save();
  return u;
}

// Every balance change goes through here so the ledger always matches the balance.
export function addTransaction(userId, type, amount, note) {
  const u = data.users[userId];
  if (!u) throw new Error("user not found");
  if (u.balance + amount < 0) throw new Error("insufficient balance");
  u.balance += amount;
  const tx = { id: newId(), userId, type, amount, note, balanceAfter: u.balance, at: Date.now() };
  data.transactions.push(tx);
  save();
  return tx;
}

export function transactionsFor(userId, limit = 50) {
  return data.transactions.filter((t) => t.userId === userId).slice(-limit).reverse();
}

export function createWithdrawal(userId, amount, method, account) {
  const tx = addTransaction(userId, "withdraw", -amount, `Withdraw request (${method})`);
  const w = { id: newId(), userId, amount, method, account, status: "pending", txId: tx.id, at: Date.now() };
  data.withdrawals.push(w);
  save();
  return w;
}

export function withdrawalsFor(userId) {
  return data.withdrawals.filter((w) => w.userId === userId).reverse();
}

export function recordMatch(m) {
  data.matches.push(m);
  if (data.matches.length > 5000) data.matches.splice(0, data.matches.length - 5000);
  save();
}

export function matchesFor(userId, limit = 20) {
  return data.matches
    .filter((m) => m.players.some((p) => p.userId === userId))
    .slice(-limit)
    .reverse();
}

export function applyResult(userId, outcome, prizeWon) {
  const u = data.users[userId];
  if (!u) return;
  if (outcome === "win") u.wins++;
  else if (outcome === "loss") u.losses++;
  else u.draws++;
  u.earnings += prizeWon;
  save();
}

export function markSeen(userId, questionIds) {
  const u = data.users[userId];
  if (!u) return;
  u.seen = [...u.seen, ...questionIds].slice(-SEEN_HISTORY);
  save();
}

export function seenSet(userId) {
  return new Set(data.users[userId]?.seen || []);
}

export function leaderboard(limit = 50) {
  return Object.values(data.users)
    .filter((u) => u.wins + u.losses + u.draws > 0)
    .sort((a, b) => b.earnings - a.earnings || b.wins - a.wins)
    .slice(0, limit)
    .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar, wins: u.wins, losses: u.losses, earnings: u.earnings }));
}

// Latest paid-match winners for the live feed on the home screen.
export function recentWins(limit = 12) {
  const out = [];
  for (let i = data.matches.length - 1; i >= 0 && out.length < limit; i--) {
    const m = data.matches[i];
    if ((m.mode !== "paid" && m.mode !== "house") || !m.winner || m.winner === "bot") continue;
    const w = m.players.find((p) => p.userId === m.winner);
    const l = m.players.find((p) => p.userId !== m.winner);
    out.push({ id: m.id, winner: w.name, avatar: data.users[w.userId]?.avatar, loser: l.name, prize: m.prize, category: m.category, at: m.at });
  }
  return out;
}

export function paidOutSince(ts) {
  return data.matches.reduce((sum, m) => sum + ((m.mode === "paid" || m.mode === "house") && m.winner && m.winner !== "bot" && m.at >= ts ? m.prize : 0), 0);
}

// The app's own profit/loss from matches it played against users (computer opponent).
export function addHouse(amount) {
  data.house ||= { net: 0, matches: 0 };
  data.house.net += amount;
  if (amount > 0) data.house.matches++;
  save();
}

// Messages from the website contact form (read them in data/db.json until there's an admin panel).
export function saveMessage(msg) {
  data.messages ||= [];
  data.messages.push({ id: newId(), ...msg, at: Date.now(), status: "new" });
  save();
}
