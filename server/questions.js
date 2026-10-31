// Question bank: hand-written seed questions + a pool that Claude Haiku keeps topped up.
// Every AI batch goes through a second "fact-check" call and only questions that pass are kept,
// because a wrong answer key in a paid match means a real dispute.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { DATA_DIR } from "./db.js";
import { SEED } from "./seed-questions.js";

const MODEL = "claude-haiku-5-5";
const POOL_FILE = path.join(DATA_DIR, "questions.json");
const TARGET_POOL_SIZE = Number(process.env.QUESTION_POOL_SIZE || 300); // per category
const BATCH_SIZE = 25;

export const CATEGORIES = [
  { id: "pakistan", name: "Pakistan GK", urdu: "پاکستان", icon: "🇵🇰" },
  { id: "cricket", name: "Cricket", urdu: "کرکٹ", icon: "🏏" },
  { id: "world", name: "Duniya GK", urdu: "دنیا", icon: "🌍" },
  { id: "science", name: "Science", urdu: "سائنس", icon: "🔬" },
  { id: "math", name: "Math Speed", urdu: "حساب", icon: "⚡" },
];

// Rotating sub-topics keep AI batches varied instead of 300 versions of the same 20 facts.
const SUBTOPICS = {
  pakistan: [
    "Pakistan Movement history 1857-1947", "geography: rivers, mountains, lakes, passes",
    "cities and famous landmarks", "provinces, regions and their capitals", "national symbols and emblems",
    "culture, food, festivals and dresses", "famous historic personalities", "Pakistani sports other than cricket (hockey, squash)",
    "history 1947-2000", "Pakistani literature, poets and writers",
  ],
  cricket: [
    "Pakistan cricket legends and their records", "ICC World Cup history", "cricket rules and terminology",
    "famous Test match records", "ODI records", "T20 history", "cricket grounds around the world",
    "nicknames of famous cricketers",
  ],
  world: [
    "world capitals", "currencies", "world geography: rivers, mountains, oceans", "famous landmarks",
    "world history", "inventions and inventors", "languages and countries", "flags and national symbols",
    "Muslim world geography and history",
  ],
  science: [
    "human body", "space and solar system", "chemistry and elements", "physics basics",
    "plants and animals", "computers and technology", "famous scientists and discoveries", "everyday science",
  ],
};

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
let aiDisabledReason = client ? null : "ANTHROPIC_API_KEY not set";

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
for (const [cat, items] of Object.entries(SEED)) {
  pool[cat] ||= [];
  const have = new Set(pool[cat].map((x) => x.id));
  for (const [q, correct, wrong] of items) {
    const id = hashId(cat, q);
    if (!have.has(id)) pool[cat].push({ id, q, correct, wrong, difficulty: "easy", source: "seed" });
  }
}
savePool();

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

// Picks questions neither player has seen recently (falls back to seen ones if the pool is thin).
export function pickQuestions(category, count, seenSets = []) {
  if (category === "math") return Array.from({ length: count }, (_, i) => mathQuestion(i));
  const items = pool[category] || [];
  const fresh = items.filter((x) => !seenSets.some((s) => s.has(x.id)));
  const chosen = shuffle(fresh).slice(0, count);
  if (chosen.length < count) {
    const ids = new Set(chosen.map((x) => x.id));
    chosen.push(...shuffle(items.filter((x) => !ids.has(x.id))).slice(0, count - chosen.length));
  }
  ensurePool(category);
  return chosen.map(toMatchQuestion);
}

// ---------- AI generation ----------

const GeneratedSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      correct_answer: z.string(),
      wrong_answers: z.array(z.string()),
      difficulty: z.enum(["easy", "medium", "hard"]),
    }),
  ),
});

const VerdictSchema = z.object({
  verdicts: z.array(z.object({ number: z.number().int(), ok: z.boolean() })),
});

const GEN_SYSTEM = `You write multiple-choice quiz questions for a Pakistani quiz-battle app where players compete for prizes, so accuracy matters more than anything.
Rules:
- Only use facts you are certain about and that do not change over time. Never ask about "current" office holders, latest records, recent rankings, or anything after 2023.
- Exactly one answer is correct; the three wrong answers must be clearly wrong but plausible.
- Keep questions short (under 20 words) and in simple English that a Pakistani student would understand.
- Answers should be short (1-5 words).
- Mix difficulty: about 40% easy, 40% medium, 20% hard.
- Nothing religiously, politically or ethnically controversial.`;

const VERIFY_SYSTEM = `You are a strict fact-checker for a quiz app with money prizes. For each question, set ok=true only if ALL of these hold:
- the marked correct answer is definitely correct,
- none of the wrong answers could also be considered correct,
- the question is unambiguous and not time-sensitive,
- it is not religiously, politically or ethnically controversial.
When in doubt, set ok=false.`;

const generating = new Set();
const topicCursor = {};

async function generateBatch(category) {
  const topics = SUBTOPICS[category];
  topicCursor[category] = ((topicCursor[category] ?? crypto.randomInt(topics.length)) + 1) % topics.length;
  const topic = topics[topicCursor[category]];
  const catName = CATEGORIES.find((c) => c.id === category).name;
  const existing = shuffle(pool[category]).slice(0, 60).map((x) => "- " + x.q).join("\n");

  const gen = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: zodOutputFormat(GeneratedSchema) },
    system: GEN_SYSTEM,
    messages: [{
      role: "user",
      content: `Category: ${catName}\nFocus topic: ${topic}\nWrite ${BATCH_SIZE} new questions with exactly 3 wrong answers each.\n\nDo not repeat or rephrase these existing questions:\n${existing}`,
    }],
  });
  if (gen.stop_reason !== "end_turn" || !gen.parsed_output) {
    console.warn(`[questions] generation for ${category} stopped: ${gen.stop_reason}`);
    return 0;
  }

  const have = new Set(pool[category].map((x) => x.id));
  const candidates = gen.parsed_output.questions.filter((q) => {
    const answers = [q.correct_answer, ...q.wrong_answers].map(norm);
    return q.wrong_answers.length === 3 && new Set(answers).size === 4 && !have.has(hashId(category, q.question));
  });
  if (!candidates.length) return 0;

  const listing = candidates
    .map((q, i) => `${i + 1}. ${q.question}\n   Correct: ${q.correct_answer}\n   Wrong: ${q.wrong_answers.join(" | ")}`)
    .join("\n");
  const check = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: "high", format: zodOutputFormat(VerdictSchema) },
    system: VERIFY_SYSTEM,
    messages: [{ role: "user", content: `Check these ${candidates.length} questions:\n\n${listing}` }],
  });
  if (check.stop_reason !== "end_turn" || !check.parsed_output) {
    console.warn(`[questions] verification for ${category} stopped: ${check.stop_reason}`);
    return 0;
  }

  const okNumbers = new Set(check.parsed_output.verdicts.filter((v) => v.ok).map((v) => v.number));
  let added = 0;
  candidates.forEach((q, i) => {
    if (!okNumbers.has(i + 1)) return;
    const id = hashId(category, q.question);
    if (have.has(id)) return;
    have.add(id);
    pool[category].push({ id, q: q.question, correct: q.correct_answer, wrong: q.wrong_answers, difficulty: q.difficulty, source: "ai", topic });
    added++;
  });
  savePool();
  console.log(`[questions] ${category}/${topic}: +${added} (${candidates.length - added} rejected by fact-check), pool=${pool[category].length}`);
  return added;
}

export async function ensurePool(category) {
  if (aiDisabledReason || category === "math" || generating.has(category)) return;
  if ((pool[category]?.length || 0) >= TARGET_POOL_SIZE) return;
  generating.add(category);
  try {
    let stalls = 0;
    while (pool[category].length < TARGET_POOL_SIZE && stalls < 3) {
      const added = await generateBatch(category);
      stalls = added ? 0 : stalls + 1;
    }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      aiDisabledReason = "API key rejected";
      console.error("[questions] Anthropic API key was rejected - AI question generation is off.");
    } else if (err instanceof Anthropic.RateLimitError) {
      console.warn("[questions] rate limited, will retry on the next match");
    } else if (err instanceof Anthropic.APIConnectionError) {
      console.warn("[questions] could not reach the Anthropic API:", err.message);
    } else if (err instanceof Anthropic.APIError) {
      console.error(`[questions] API error ${err.status}:`, err.message);
    } else {
      console.error("[questions] generation failed:", err);
    }
  } finally {
    generating.delete(category);
  }
}

export function aiStatus() {
  return aiDisabledReason ? `off (${aiDisabledReason})` : `on (${MODEL})`;
}

// Fill categories one after another at startup so we don't fire every request at once.
export async function warmUp() {
  for (const c of CATEGORIES) await ensurePool(c.id);
}
