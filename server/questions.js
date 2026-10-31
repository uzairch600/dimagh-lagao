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
import * as store from "./store.js";

const MODEL = "claude-haiku-5-5";
const POOL_FILE = path.join(DATA_DIR, "questions.json");
const BATCH_SIZE = 25;

export const CATEGORIES = [
  { id: "world", name: "World GK", urdu: "معلومات عامہ" },
  { id: "cricket", name: "Cricket", urdu: "کرکٹ" },
  { id: "science", name: "Science", urdu: "سائنس" },
  { id: "math", name: "Math Speed", urdu: "حساب" },
  { id: "it", name: "IT & Computers", urdu: "کمپیوٹر" },
  { id: "ai", name: "AI", urdu: "مصنوعی ذہانت" },
  { id: "entertainment", name: "Entertainment", urdu: "تفریح" },
];

// Rotating sub-topics keep AI batches varied instead of 300 versions of the same 20 facts.
const SUBTOPICS = {
  cricket: [
    "Pakistan cricket legends and their records", "ICC World Cup history", "cricket rules and terminology",
    "famous Test match records", "ODI records", "T20 history", "cricket grounds around the world",
    "nicknames of famous cricketers",
  ],
  world: [
    "world capitals", "currencies", "world geography: rivers, mountains, oceans", "famous landmarks",
    "world history", "inventions and inventors", "languages and countries", "flags and national symbols",
    "Muslim world geography and history", "Pakistan history and the Pakistan Movement", "Pakistan geography, cities and landmarks",
    "Pakistan national symbols, culture and famous personalities",
  ],
  science: [
    "human body", "space and solar system", "chemistry and elements", "physics basics",
    "plants and animals", "famous scientists and discoveries", "everyday science",
  ],
  it: [
    "computer hardware basics", "operating systems", "internet and web basics", "programming languages",
    "history of computing and famous tech companies (before 2023)", "file formats and abbreviations (CPU, RAM, URL...)",
    "networking basics", "cyber security basics", "keyboard shortcuts and everyday software",
  ],
  ai: [
    "history of artificial intelligence (Turing, Dartmouth 1956, expert systems)", "famous AI milestones before 2023 (Deep Blue, Watson, AlphaGo)",
    "machine learning basic terms", "neural networks basics", "AI in everyday life (voice assistants, recommendations, maps)",
    "robotics basics", "data and datasets basics", "AI ethics basics",
  ],
  entertainment: [
    "classic animated films", "famous Hollywood films before 2023", "classic Bollywood and Lollywood films",
    "famous Pakistani TV dramas before 2023", "music instruments and famous songs", "superheroes and comics",
    "famous books and authors", "classic video games",
  ],
};

// Extra rules per category on top of the general rules (accuracy-sensitive topics).
const CATEGORY_RULES = {
  entertainment: "Only well-known, long-settled facts about films, books, music and games. Nothing about celebrities' personal lives, relationships, religion or politics.",
  ai: "Mix AI history, core concepts (algorithms, architectures, training) and dated milestones; pin anything recent to its year. No opinions or predictions.",
  it: "Technical questions are welcome (protocols, ports, standards, data structures, hardware specs); pin anything recent to its year. No prices or market share.",
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
if (store.enabled) {
  const remote = await store.loadQuestions();
  if (Object.keys(remote).length === 0) {
    for (const [cat, items] of Object.entries(pool)) await store.saveQuestions(cat, items);
    console.log("[questions] copied local question pool into Supabase");
  } else {
    for (const [cat, items] of Object.entries(remote)) {
      const have = new Set((pool[cat] ||= []).map((x) => x.id));
      for (const q of items) if (!have.has(q.id)) pool[cat].push(q);
    }
  }
}
savePool();

function savePool(category, added) {
  fs.writeFileSync(POOL_FILE, JSON.stringify(pool, null, 2));
  if (store.enabled && category && added?.length) {
    store.saveQuestions(category, added).catch((err) => console.error("[questions] saving to Supabase failed:", err.message));
  }
}

// Only the new web-researched, hard questions count towards the target, so older easy ones get topped up.
const isHard = (q) => q.v === 2;
const hardCount = (category) => (pool[category] || []).filter(isHard).length;

export function poolStats() {
  return Object.fromEntries(Object.entries(pool).map(([k, v]) => [k, `${v.length} (${v.filter(isHard).length} hard)`]));
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

// Stored questions neither player has seen (used only to top up a match the AI couldn't fill).
function storedUnseen(category, count, seenSets) {
  const items = pool[category] || [];
  const fresh = items.filter((x) => !seenSets.some((s) => s.has(x.id)));
  // hard, web-researched questions first; older ones only fill the gaps
  const trivial = (x) => x.source === "seed" || x.difficulty === "easy" || /stand for|full form|shortcut|keyboard/i.test(x.q);
  const chosen = [
    ...shuffle(fresh.filter(isHard)),
    ...shuffle(fresh.filter((x) => !isHard(x) && !trivial(x))),
    ...shuffle(fresh.filter((x) => !isHard(x) && trivial(x))),
  ].slice(0, count);
  if (chosen.length < count) {
    // last resort only: every stored question has been seen by these players
    console.warn(`[questions] ${category}: only ${chosen.length} unseen stored questions, reusing seen ones`);
    const ids = new Set(chosen.map((x) => x.id));
    chosen.push(...shuffle(items.filter((x) => !ids.has(x.id))).slice(0, count - chosen.length));
  }
  return chosen;
}

// ---------- AI generation ----------

const GeneratedSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      correct_answer: z.string(),
      wrong_answers: z.array(z.string()),
      difficulty: z.enum(["medium", "hard", "insane"]),
    }),
  ),
});

const VerdictSchema = z.object({
  verdicts: z.array(z.object({ number: z.number().int(), ok: z.boolean() })),
});

const GEN_SYSTEM = `You write INSANE-level multiple-choice quiz questions for a Pakistani 1v1 quiz-battle app where experts compete for prizes. Accuracy matters more than anything.
Rules:
- Build every question ONLY on the researched facts you are given. Never invent a fact.
- Every question must be very hard: something only a true expert or obsessive fan would get right. Never ask textbook basics: no definitions, no "what does X stand for", no keyboard shortcuts, no famous capitals, no "who invented the telephone"-level trivia.
- Be creative. Mix these styles:
  * exact figures and records ("How many ... did ... score/sell/measure ...?")
  * reverse lookups (give a precise stat or event, ask who/what it was)
  * chronology ("Which of these happened FIRST?" with four real events)
  * connections ("Which of these four ALSO ...?")
  * odd-one-out ("Which of these did NOT ...?") — only when the fact sheet proves all four
- Each question must be answerable within 20 seconds by someone who truly knows: under 25 words, answers 1-6 words, no trick wording.
- Exactly one answer is correct; the three wrong answers must be very plausible (same type, close numbers, same era) but definitely wrong.
- If a fact can change over time, put the date or season in the question. Never use "current", "latest", "now" or "recently".
- Simple English. Nothing religiously, politically or ethnically controversial; nothing about celebrities' private lives.`;

const VERIFY_SYSTEM = `You are a strict fact-checker for a quiz app with money prizes. You get researched facts and a list of questions. For each question, set ok=true only if ALL of these hold:
- the marked correct answer is directly supported by the researched facts (or is a fact you are completely certain of),
- none of the wrong answers could also be considered correct,
- the question is unambiguous, and any time-sensitive fact is pinned to a date or season in the question,
- it is not religiously, politically or ethnically controversial.
When in doubt, set ok=false.`;

// ---------- cost control ----------
// Haiku 5.5 list prices (USD per million tokens) and web search (USD per search).
const PRICE = { input: 0.1, output: 0.5, search: 0.01 };
const DAILY_BATCH_CAP = Number(process.env.AI_DAILY_BATCH_CAP || 20);
const DAILY_COST_CAP = Number(process.env.AI_DAILY_COST_CAP_USD || 1);
const today = () => new Date().toISOString().slice(0, 10);
let usage = { id: "ai-usage-" + today(), day: today(), calls: 0, batches: 0, input: 0, output: 0, searches: 0, usd: 0 };

function track(res, kind) {
  if (usage.day !== today()) usage = { id: "ai-usage-" + today(), day: today(), calls: 0, batches: 0, input: 0, output: 0, searches: 0, usd: 0 };
  const u = res.usage || {};
  const input = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
  const searches = u.server_tool_use?.web_search_requests || 0;
  const usd = input * PRICE.input / 1e6 + (u.output_tokens || 0) * PRICE.output / 1e6 + searches * PRICE.search;
  Object.assign(usage, { calls: usage.calls + 1, input: usage.input + input, output: usage.output + (u.output_tokens || 0), searches: usage.searches + searches, usd: usage.usd + usd });
  console.log(`[ai] ${kind}: in=${input} out=${u.output_tokens || 0} searches=${searches} ≈ ${usd.toFixed(4)} | today ${usage.usd.toFixed(3)} in ${usage.calls} calls`);
  if (store.enabled) store.queue("kv", { ...usage });
}

function overDailyCap() {
  if (usage.day !== today()) return false;
  return usage.batches >= DAILY_BATCH_CAP || usage.usd >= DAILY_COST_CAP;
}

export function aiUsageToday() {
  return { ...usage, batchCap: DAILY_BATCH_CAP, costCapUsd: DAILY_COST_CAP };
}

// Restarting the server must not reset today's spend.
if (store.enabled) {
  const saved = (await store.loadAll("kv")).find((r) => r.id === usage.id);
  if (saved) usage = { ...usage, ...saved };
}

const NO_THINKING = { type: "disabled" };

const RESEARCH_SYSTEM = `You are a research assistant for a quiz writer. Use web search to collect accurate, verifiable facts. Prefer authoritative sources (official bodies, encyclopedias, reputable news). Report only facts you found in sources.`;

// Step 1: web research. Returns a bullet list of dated, sourced facts for the topic.
async function research(catName, topic) {
  const messages = [{
    role: "user",
    content: `Topic: ${catName} — ${topic}.
Search the web and collect 35 precise facts for EXPERT-level quiz questions: obscure but well-documented details, exact figures, records, firsts, dates, technical specifics, surprising connections between two things. Avoid textbook basics (definitions, acronym expansions, famous capital cities, keyboard shortcuts).
Cover at least 12 DIFFERENT subjects within the topic (no more than 3 facts about any single person, place, team, film or thing), and include Pakistan-related subjects where they fit.
For anything that can change over time, include the date or season in the fact.
Return only a plain bullet list, one fact per line, each ending with the source site name in brackets.`,
  }];
  for (let turn = 0; turn < 3; turn++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 6000,
      system: RESEARCH_SYSTEM,
      thinking: NO_THINKING,
      output_config: { effort: "low" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
      messages,
    });
    track(res, "research");
    if (res.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: res.content });
      continue;
    }
    if (res.stop_reason !== "end_turn") return "";
    return res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  }
  return "";
}

const topicCursor = {};
// Web research makes a match ~30-40s slower and ~15-20x more expensive, so it is off unless enabled.
const WEB_RESEARCH = process.env.AI_WEB_RESEARCH === "true";
const SPARE = 4; // a few extra questions in case the fact-check rejects some

function nextTopic(category) {
  const topics = SUBTOPICS[category];
  topicCursor[category] = ((topicCursor[category] ?? crypto.randomInt(topics.length)) + 1) % topics.length;
  return topics[topicCursor[category]];
}

function handleAiError(err) {
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    aiDisabledReason = "API key rejected";
    console.error("[questions] Anthropic API key was rejected - AI question generation is off.");
  } else if (err instanceof Anthropic.RateLimitError) {
    console.warn("[questions] rate limited - this match uses stored questions");
  } else if (err instanceof Anthropic.APIConnectionError) {
    console.warn("[questions] could not reach the Anthropic API:", err.message);
  } else if (err instanceof Anthropic.APIError) {
    console.error(`[questions] API error ${err.status}:`, err.message);
  } else {
    console.error("[questions] generation failed:", err);
  }
}

// ONE call writes the match's questions with their options, ONE call fact-checks them.
async function generateForMatch(category, count, seenIds, avoidList) {
  const topic = nextTopic(category);
  const catName = CATEGORIES.find((c) => c.id === category).name;
  const facts = WEB_RESEARCH ? await research(catName, topic) : "";
  const source = facts
    ? "Build every question ONLY on the researched facts you are given. Never invent a fact."
    : "You have no web access: use ONLY facts you are completely certain of (long-documented records, dates, numbers, details). Never guess or invent a fact.";
  const system = GEN_SYSTEM.replace("Build every question ONLY on the researched facts you are given. Never invent a fact.", source);

  const gen = await client.messages.parse({
    model: MODEL,
    max_tokens: 3000,
    thinking: NO_THINKING,
    output_config: { effort: "medium", format: zodOutputFormat(GeneratedSchema) },
    system,
    messages: [{
      role: "user",
      content: `Category: ${catName}\nFocus topic: ${topic}\n${CATEGORY_RULES[category] ? `Extra rules: ${CATEGORY_RULES[category]}\n` : ""}${facts ? `\nRESEARCHED FACTS:\n${facts}\n` : ""}
Write ${count + SPARE} questions, every one at the hardest expert level, each with exactly 3 wrong answers.

These players have already seen the following questions; do not repeat or rephrase them:
${avoidList}`,
    }],
  });
  track(gen, "generate");
  if (gen.stop_reason !== "end_turn" || !gen.parsed_output) {
    console.warn(`[questions] generation for ${category} stopped: ${gen.stop_reason}`);
    return [];
  }

  const ids = new Set();
  const candidates = gen.parsed_output.questions.filter((q) => {
    const id = hashId(category, q.question);
    const answers = [q.correct_answer, ...q.wrong_answers].map(norm);
    const ok = q.wrong_answers.length === 3 && new Set(answers).size === 4 && !seenIds.has(id) && !ids.has(id);
    ids.add(id);
    return ok;
  });
  if (!candidates.length) {
    console.warn(`[questions] ${category}: AI returned ${gen.parsed_output.questions.length} questions, none usable (bad options, duplicates or already seen)`);
    return [];
  }

  const listing = candidates
    .map((q, i) => `${i + 1}. ${q.question}\n   Correct: ${q.correct_answer}\n   Wrong: ${q.wrong_answers.join(" | ")}`)
    .join("\n");
  const check = await client.messages.parse({
    model: MODEL,
    max_tokens: 1000,
    thinking: NO_THINKING,
    output_config: { effort: "medium", format: zodOutputFormat(VerdictSchema) },
    system: VERIFY_SYSTEM,
    messages: [{
      role: "user",
      content: `${facts ? `RESEARCHED FACTS:\n${facts}` : "No research is available: judge with your own knowledge and reject anything you are not completely sure of."}\n\nCheck these ${candidates.length} questions:\n\n${listing}`,
    }],
  });
  track(check, "verify");
  if (check.stop_reason !== "end_turn" || !check.parsed_output) {
    console.warn(`[questions] verification for ${category} stopped: ${check.stop_reason}`);
    return [];
  }

  const okNumbers = new Set(check.parsed_output.verdicts.filter((v) => v.ok).map((v) => v.number));
  const accepted = candidates
    .filter((_, i) => okNumbers.has(i + 1))
    .map((q) => ({
      id: hashId(category, q.question), q: q.question, correct: q.correct_answer, wrong: q.wrong_answers,
      difficulty: q.difficulty, source: "ai-match", topic, v: 2, at: Date.now(),
    }));
  pool[category].push(...accepted);
  savePool(category, accepted);
  console.log(`[questions] ${category}/${topic}: ${accepted.length} accepted, ${candidates.length - accepted.length} rejected by fact-check`);
  return accepted;
}

// Called once when a match starts. This is the ONLY place the AI runs.
export async function questionsForMatch(category, count, seenSets = []) {
  if (category === "math") return Array.from({ length: count }, (_, i) => mathQuestion(i));
  const started = Date.now();
  const usdBefore = usage.usd;
  const seenIds = new Set(seenSets.flatMap((s) => [...s]));
  let items = [];

  if (!client || aiDisabledReason) {
    // no AI available: stored questions only
  } else if (overDailyCap()) {
    console.warn(`[questions] daily AI cap reached (${usage.batches} matches, $${usage.usd.toFixed(2)}) — using stored questions`);
  } else {
    usage.batches++;
    try {
      const avoid = (pool[category] || []).filter((q) => seenIds.has(q.id)).slice(-40).map((q) => "- " + q.q).join("\n") || "(none yet)";
      items = await generateForMatch(category, count, seenIds, avoid);
    } catch (err) {
      handleAiError(err);
    }
  }

  const fromAi = Math.min(items.length, count);
  if (items.length < count) items = [...items, ...storedUnseen(category, count - items.length, [...seenSets, new Set(items.map((x) => x.id))])];
  console.log(`[match-questions] ${category}: ${fromAi} new from AI + ${Math.min(count, items.length) - fromAi} stored, ready in ${((Date.now() - started) / 1000).toFixed(1)}s, ≈ $${(usage.usd - usdBefore).toFixed(4)}`);
  return shuffle(items.slice(0, count)).map(toMatchQuestion);
}

export function aiStatus() {
  return aiDisabledReason ? `off (${aiDisabledReason})` : `on (${MODEL}, only when a match starts${WEB_RESEARCH ? ", with web research" : ""})`;
}

// Nothing runs in the background any more; kept so the server can log the setup.
export function warmUp() {
  console.log(`[questions] AI runs only when a match starts. Daily cap: ${DAILY_BATCH_CAP} matches or $${DAILY_COST_CAP}.`);
}
