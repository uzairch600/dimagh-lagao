// Question bank: the stored pool (data/questions.json + Supabase) plus hand-written seed questions.
// Matches pick from it at random, so a question can come up again in later matches.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PUZZLE_CATEGORIES } from "./puzzles.js";
import { DATA_DIR } from "./db.js";
import { SEED } from "./seed-questions.js";
import * as store from "./store.js";

const POOL_FILE = path.join(DATA_DIR, "questions.json");

// group "quiz": multiple-choice questions. group "puzzle": a puzzle board played alone (server/puzzles.js).
export const CATEGORIES = [
  { id: "world", name: "World GK", urdu: "معلومات عامہ", group: "quiz" },
  { id: "cricket", name: "Cricket", urdu: "کرکٹ", group: "quiz" },
  { id: "science", name: "Science", urdu: "سائنس", group: "quiz" },
  { id: "math", name: "Math Speed", urdu: "حساب", group: "quiz" },
  { id: "it", name: "IT & Computers", urdu: "کمپیوٹر", group: "quiz" },
  { id: "ai", name: "AI", urdu: "مصنوعی ذہانت", group: "quiz" },
  { id: "entertainment", name: "Entertainment", urdu: "تفریح", group: "quiz" },
  ...PUZZLE_CATEGORIES,
];

// ---------- pool storage ----------

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const hashId = (cat, q) => cat + "_" + crypto.createHash("sha1").update(norm(q)).digest("hex").slice(0, 12);

let pool = {};
if (fs.existsSync(POOL_FILE)) {
  try {
    pool = JSON.parse(fs.readFileSync(POOL_FILE, "utf8"));
  } catch {
    pool = {};
  }
}
// "Pakistan GK" was merged into World GK: carry its questions over.
if (pool.pakistan) {
  pool.world = [...(pool.world || []), ...pool.pakistan];
  delete pool.pakistan;
}
for (const [cat, items] of Object.entries(SEED)) {
  pool[cat] ||= [];
  const have = new Set(pool[cat].map((x) => norm(x.q)));
  for (const [q, correct, wrong] of items) {
    if (!have.has(norm(q))) pool[cat].push({ id: hashId(cat, q), q, correct, wrong, difficulty: "easy", source: "seed" });
  }
}
savePool();

// Supabase holds the same pool. Startup must not wait for it (2,700 rows took ~55s on a slow link), so the server
// starts with the local copy and merges what only Supabase has in the background.
async function syncPoolWithStore() {
  const started = Date.now();
  const remote = await store.loadQuestions();
  if (Object.keys(remote).length === 0) {
    for (const [cat, items] of Object.entries(pool)) await store.saveQuestions(cat, items);
    console.log("[questions] copied local question pool into Supabase");
    return;
  }
  let added = 0;
  for (const [cat, items] of Object.entries(remote)) {
    const have = new Set((pool[cat] ||= []).map((x) => x.id));
    for (const q of items) {
      if (have.has(q.id)) continue;
      pool[cat].push(q);
      added++;
    }
  }
  savePool();
  console.log(`[questions] pool synced with Supabase in ${((Date.now() - started) / 1000).toFixed(1)}s (${added} new from the database)`);
}
if (store.enabled) syncPoolWithStore().catch((err) => console.error("[questions] Supabase sync failed:", err.message));

function savePool() {
  fs.writeFileSync(POOL_FILE, JSON.stringify(pool, null, 2));
}

export function poolStats() {
  return Object.fromEntries(Object.entries(pool).map(([k, v]) => [k, v.length]));
}

// ---------- picking questions for a match ----------

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toMatchQuestion(item) {
  const options = shuffle([item.correct, ...item.wrong]);
  return { id: item.id, text: item.q, options, answerIndex: options.indexOf(item.correct) };
}

function mathQuestion(level) {
  const r = (lo, hi) => lo + crypto.randomInt(hi - lo + 1);
  let a, b, op, ans;
  const kind = crypto.randomInt(level < 3 ? 2 : level < 6 ? 3 : 4);
  if (kind === 0) {
    a = r(10, 40 + level * 15); b = r(10, 40 + level * 15); op = "+"; ans = a + b;
  } else if (kind === 1) {
    a = r(30, 60 + level * 15); b = r(5, a - 1); op = "−"; ans = a - b;
  } else if (kind === 2) {
    a = r(3, 9 + level); b = r(3, 12); op = "×"; ans = a * b;
  } else {
    b = r(3, 12); ans = r(3, 9 + level); a = b * ans; op = "÷";
  }
  const wrong = new Set();
  while (wrong.size < 3) {
    const d = (crypto.randomInt(2) ? 1 : -1) * r(1, Math.max(3, Math.round(ans * 0.15)));
    const w = ans + d;
    if (w !== ans && w >= 0) wrong.add(w);
  }
  return toMatchQuestion({
    id: "math_" + crypto.randomBytes(4).toString("hex"),
    q: `${a} ${op} ${b} = ?`,
    correct: String(ans),
    wrong: [...wrong].map(String),
  });
}

export function questionsForMatch(category, count) {
  if (category === "math") return Array.from({ length: count }, (_, i) => mathQuestion(i));
  // ai-match questions without a `web` mark were written before web research worked: never grounded in a source
  const usable = (pool[category] || []).filter((x) => !(x.source === "ai-match" && !x.web));
  return shuffle(usable).slice(0, count).map(toMatchQuestion);
}
