// Game data. Kept in memory; persisted to Supabase Postgres when DATABASE_URL is set,
// otherwise to data/db.json (handy for local testing).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as store from "./store.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const SEEN_HISTORY = 400; // how many recent question ids we remember per player

fs.mkdirSync(DATA_DIR, { recursive: true });

const empty = () => ({ users: {}, matches: [], messages: [], flags: [] });

let data = empty();
let fileData = null;
if (fs.existsSync(DB_FILE)) {
  try {
    fileData = { ...empty(), ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) };
  } catch (err) {
    console.error("[db] could not read db.json:", err.message);
  }
}

export const backend = store.enabled ? "supabase" : "file";
const byAt = (a, b) => (a.at ?? 0) - (b.at ?? 0);

if (store.enabled) {
  await store.init();
  const [users, matches, messages, flags] = await Promise.all(["users", "matches", "messages", "flags"].map((t) => store.loadAll(t)));
  data.users = Object.fromEntries(users.map((u) => [u.id, u]));
  data.matches = matches.sort(byAt);
  data.messages = messages.sort(byAt);
  data.flags = flags.sort(byAt);
} else if (fileData) {
  data = fileData;
}

let saveTimer = null;
function saveFile() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const tmp = DB_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, DB_FILE);
  }, 300);
}

// Persist one changed row (Supabase) or the whole file (local).
function save(table, row) {
  if (store.enabled) store.queue(table, row);
  else saveFile();
}

export const newId = () => crypto.randomBytes(8).toString("hex");

export function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    avatar: u.avatar,
    wins: u.wins,
    losses: u.losses,
    draws: u.draws,
    puzzles: u.puzzles || 0,
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
    wins: 0,
    losses: 0,
    draws: 0,
    puzzles: 0,
    seen: [],
    createdAt: Date.now(),
  };
  data.users[u.id] = u;
  save("users", u);
  return u;
}

export function updateProfile(userId, { name, avatar }) {
  const u = data.users[userId];
  if (name) u.name = name;
  if (avatar) u.avatar = avatar;
  save("users", u);
  return u;
}

export function recordMatch(m) {
  data.matches.push(m);
  if (data.matches.length > 5000) data.matches.splice(0, data.matches.length - 5000);
  save("matches", m);
}

export function matchesFor(userId, limit = 20) {
  return data.matches
    .filter((m) => m.players.some((p) => p.userId === userId))
    .slice(-limit)
    .reverse();
}

// A finished 1v1 against a real player.
export function applyResult(userId, outcome) {
  const u = data.users[userId];
  if (!u) return;
  if (outcome === "win") u.wins++;
  else if (outcome === "loss") u.losses++;
  else u.draws++;
  save("users", u);
}

export function addPuzzleSolved(userId) {
  const u = data.users[userId];
  if (!u) return;
  u.puzzles = (u.puzzles || 0) + 1;
  save("users", u);
}

export function markSeen(userId, questionIds) {
  const u = data.users[userId];
  if (!u) return;
  u.seen = [...u.seen, ...questionIds].slice(-SEEN_HISTORY);
  save("users", u);
}

export function seenSet(userId) {
  return new Set(data.users[userId]?.seen || []);
}

export function leaderboard(limit = 50) {
  return Object.values(data.users)
    .filter((u) => u.wins + u.losses + u.draws + (u.puzzles || 0) > 0)
    .sort((a, b) => b.wins - a.wins || (b.puzzles || 0) - (a.puzzles || 0) || a.losses - b.losses)
    .slice(0, limit)
    .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar, wins: u.wins, losses: u.losses, puzzles: u.puzzles || 0 }));
}

// Latest results for the live feed: 1v1 wins against real players and solved puzzles.
export function recentWins(limit = 12) {
  const out = [];
  for (let i = data.matches.length - 1; i >= 0 && out.length < limit; i--) {
    const m = data.matches[i];
    const w = m.players.find((p) => p.userId === m.winner);
    if (!w || w.userId === "bot" || w.userId === "ghost") continue;
    const opp = m.players.find((p) => p !== w);
    if (m.mode === "free") out.push({ id: m.id, kind: "win", winner: w.name, avatar: data.users[w.userId]?.avatar, loser: opp.name, category: m.category, at: m.at });
    else if (opp.userId === "ghost") out.push({ id: m.id, kind: "puzzle", winner: w.name, avatar: data.users[w.userId]?.avatar, category: m.category, at: m.at });
  }
  return out;
}

export function matchesSince(ts) {
  return data.matches.filter((m) => m.at >= ts).length;
}

// Messages from the website contact form (Supabase table app.messages until there's an admin panel).
export function saveMessage(msg) {
  const m = { id: newId(), ...msg, at: Date.now(), status: "new" };
  data.messages.push(m);
  save("messages", m);
}

// Anti-cheat log: strikes (tab switch, devtools...) and suspicious timing patterns.
export function flag(entry) {
  const f = { id: newId(), at: Date.now(), ...entry };
  (data.flags ||= []).push(f);
  save("flags", f);
  return f;
}

// Every question id any player has ever been shown (to retire them globally).
export function allSeenIds() {
  const ids = new Set();
  for (const u of Object.values(data.users)) for (const id of u.seen || []) ids.add(id);
  return ids;
}
