// Question bank: hand-written seed questions + a pool that Claude Haiku keeps topped up.
// Every AI batch goes through a second "fact-check" call and only questions that pass are kept,
// because a wrong answer key in a paid match means a real dispute.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PUZZLES_PER_MATCH, PUZZLE_CATEGORIES, PUZZLE_KINDS, puzzleRound } from "./puzzles.js";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { DATA_DIR, allSeenIds } from "./db.js";
import { SEED } from "./seed-questions.js";
import * as store from "./store.js";

const MODEL = "claude-haiku-5-5";
const POOL_FILE = path.join(DATA_DIR, "questions.json");
const BATCH_SIZE = 25;

// group "quiz": multiple-choice questions. group "puzzle": a puzzle board both players solve (server/puzzles.js).
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

// Categories made on the server without AI (no prefetch, no pool, never repeat).
const LOCAL = new Set(["math", ...PUZZLE_KINDS]);

// Puzzles take longer each, so a puzzle match has fewer of them.
export const questionCount = (category, normal) => (PUZZLE_KINDS.includes(category) ? PUZZLES_PER_MATCH : normal);

// Rotating sub-topics keep AI batches varied instead of 300 versions of the same 20 facts.
const SUBTOPICS = {
  cricket: [
    "Pakistan cricket legends and their records", "ICC World Cup history", "Pakistan's ICC titles: 1992, 2009 and 2017",
    "PSL history, teams and records", "Pakistan vs India matches through the years", "famous Test match records", "ODI records",
    "T20 history", "cricket rules and terminology", "nicknames of famous cricketers",
  ],
  world: [
    "world geography: rivers, mountains, oceans", "famous landmarks", "world history everyone studies at school",
    "inventions and inventors", "languages and countries", "flags and national symbols", "currencies",
    "Muslim world geography and history", "Pakistan history and the Pakistan Movement", "Pakistan geography, cities and landmarks",
    "Pakistan national symbols, culture and famous personalities", "Pakistan's neighbours: China, Iran, Afghanistan, India, Gulf countries",
    "Olympics, hockey, football and other sports Pakistanis follow",
  ],
  science: [
    "human body", "space and solar system", "chemistry and elements", "physics basics", "plants and animals",
    "famous scientists and discoveries", "everyday science", "weather, monsoon, glaciers and rivers of Pakistan",
    "health, food and nutrition science",
  ],
  it: [
    "computer hardware basics", "operating systems", "internet and web basics", "programming languages",
    "history of computing and famous tech companies (before 2023)", "networking basics", "cyber security basics",
    "smartphones and the apps people use every day", "digital payments and mobile networks in Pakistan",
  ],
  ai: [
    "history of artificial intelligence (Turing, Dartmouth 1956, expert systems)", "famous AI milestones before 2023 (Deep Blue, Watson, AlphaGo)",
    "machine learning basic terms", "neural networks basics", "AI in everyday life (voice assistants, recommendations, maps)",
    "robotics basics", "AI chatbots and tools people use, pinned to their launch year", "AI ethics basics",
  ],
  entertainment: [
    "famous Pakistani TV dramas before 2023", "Pakistani music legends and Coke Studio Pakistan", "classic Bollywood and Lollywood films",
    "famous Hollywood films before 2023", "classic animated films and cartoons", "superheroes and comics",
    "famous books, poets and authors (including Urdu literature)", "classic video games", "music instruments and famous songs",
  ],
};

// Extra rules per category on top of the general rules (accuracy-sensitive topics).
const CATEGORY_RULES = {
  entertainment: "Only well-known, long-settled facts about films, books, music and games. Nothing about celebrities' personal lives, relationships, religion or politics.",
  ai: "Mix AI history, well-known milestones and the basic ideas behind AI tools people use; pin anything recent to its year. No opinions or predictions, no research-paper detail.",
  it: "Tech that phone and computer users actually meet, plus well-known tech history; pin anything recent to its year. No prices or market share, no specialist detail (port numbers, RFCs, chip specs).",
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
// Global no-repeat: a question text exists once across all categories, and once shown it is retired forever.
const allNorms = new Set();
for (const items of Object.values(pool)) for (const q of items) allNorms.add(norm(q.q));
{
  const seen = allSeenIds();
  const newlyUsed = [];
  for (const items of Object.values(pool)) for (const q of items) if (!q.used && seen.has(q.id)) { q.used = true; newlyUsed.push(q.id); }
  if (store.enabled && newlyUsed.length) await store.markQuestionsUsed(newlyUsed);
}
savePool();

function markUsed(items) {
  for (const q of items) q.used = true;
  savePool();
  if (store.enabled) store.markQuestionsUsed(items.map((q) => q.id)).catch((err) => console.error("[questions] marking used failed:", err.message));
}

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
// Unused stored questions (top-up only). Used questions are never shown again — no fallback to them.
function storedUnused(category, count, exclude = []) {
  // ai-match questions written before web search worked (no `web` mark) were never grounded in a search
  const fresh = (pool[category] || []).filter((x) => !x.used && !exclude.includes(x) && !(x.source === "ai-match" && !x.web));
  const trivial = (x) => x.source === "seed" || x.difficulty === "easy" || /stand for|full form|shortcut|keyboard/i.test(x.q);
  return [
    ...shuffle(fresh.filter(isHard)),
    ...shuffle(fresh.filter((x) => !isHard(x) && !trivial(x) && x.difficulty === "hard")),
    ...shuffle(fresh.filter((x) => !isHard(x) && !trivial(x) && x.difficulty !== "hard")),
  ].slice(0, count);
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
  // problem: a few words on why a question was rejected (logged so we can see what fails)
  verdicts: z.array(z.object({ number: z.number().int(), ok: z.boolean(), problem: z.string() })),
});

const GEN_SYSTEM = `You write multiple-choice quiz questions for a Pakistani 1v1 quiz-battle app with money prizes. The players are ordinary Pakistanis: students, office workers, cricket fans, people who follow the news and watch dramas. Accuracy matters more than anything.
Rules:
- Build every question ONLY on the researched facts you are given. Never invent a fact.
- Level: hard but FAIR. A well-read Pakistani who follows this topic should be able to get it right; a casual player should find it a real challenge. Never ask what only a specialist, a researcher or a foreigner living there could know.
- Audience first: Pakistan and South Asia, then the Muslim world, then subjects famous all over the world (things in Pakistani news, school books, cricket coverage, popular films and dramas). Never ask about American or European local politics, local sports leagues, local TV, states, counties or cities, minor foreign celebrities or little-known foreign companies.
- No textbook basics either: no definitions, no "what does X stand for", no keyboard shortcuts, no famous capital cities.
- Prefer memorable facts that make a player say "arre haan!": records, firsts, numbers, places, who did what, how things work.
- Mix these styles:
  * figures and records ("How many ... did ... score/win/measure ...?")
  * reverse lookups (give a well-known stat or event, ask who/what it was)
  * connections ("Which of these four ALSO ...?")
  * cause and detail ("Why / how / where did ... happen?")
- Never write "Which came first" or "Which of these is NOT / did NOT" questions.
- Spread the questions out: at most 2 questions about the same person, place, team, element, film, company or event.
- Ask about the subject itself, never about where the fact was published: no questions about websites, press releases, articles or documents, and never name a source in the question.
- Players get only 10 seconds, so each question must be readable in about 4 seconds: under 20 words, answers 1-5 words, no trick wording.
- Exactly one answer is correct; the three wrong answers must be plausible (same type, close numbers, same era) but definitely wrong.
- If a fact can change over time, put the date or season in the question. Never use "current", "latest", "now" or "recently".
- Simple English. Nothing religiously, politically or ethnically controversial; nothing about celebrities' private lives.`;

const VERIFY_SYSTEM = `You are a strict fact-checker for a quiz app with money prizes. You get researched facts and a list of questions. For each question, set ok=true only if ALL of these hold:
- the marked correct answer is directly supported by the researched facts (or is a fact you are completely certain of),
- none of the wrong answers could also be considered correct,
- the question is unambiguous, and any time-sensitive fact is pinned to a date or season in the question,
- it is not religiously, politically or ethnically controversial,
- it asks about the subject itself, not about a website, press release, article or the source of the fact,
- it is not a "which came first" or "which is NOT" question,
- it is fair for an ordinary Pakistani player who follows the topic: reject questions about American or European local politics, local leagues, local TV or places, minor foreign celebrities, little-known foreign companies, or details only a specialist would know.
When in doubt, set ok=false. For every question, put a few words in "problem" saying what is wrong (empty if ok).`;

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

// Restarting the server must not reset today's spend or forget saved research.
const kvRows = store.enabled ? await store.loadAll("kv") : [];
{
  const saved = kvRows.find((r) => r.id === usage.id);
  if (saved) usage = { ...usage, ...saved };
}

const NO_THINKING = { type: "disabled" };

const RESEARCH_SYSTEM = `You are a research assistant for a quiz writer. Use web search to collect accurate, verifiable facts. Prefer authoritative sources (official bodies, encyclopedias, reputable news). Report only facts you found in sources.`;

// Step 1: web research. Returns a bullet list of dated, sourced facts for the topic.
async function research(catName, topic) {
  const messages = [{
    role: "user",
    content: `Topic: ${catName} — ${topic}.
Search the web and collect 35 precise facts that a well-read Pakistani fan would find fair and interesting for a hard quiz: exact figures, records, firsts, dates, surprising connections between two things. Pakistan and South Asia first, then world-famous subjects. No US or European local news, no politics, no obscure local figures. Avoid textbook basics (definitions, acronym expansions, famous capital cities, keyboard shortcuts).
Cover at least 12 DIFFERENT subjects within the topic (no more than 3 facts about any single person, place, team, film or thing), and include Pakistan-related subjects where they fit.
For anything that can change over time, include the date or season in the fact.
Return only a plain bullet list, one fact per line, each ending with the source site name in brackets.`,
  }];
  let hits = 0; // search results that actually came back
  for (let turn = 0; turn < 3; turn++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 6000,
      system: RESEARCH_SYSTEM,
      thinking: NO_THINKING,
      output_config: { effort: "low" },
      // Haiku needs the basic tool version: with web_search_20260209 every search fails with invalid_tool_input
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
      messages,
    });
    track(res, "research");
    hits += res.content.filter((b) => b.type === "web_search_tool_result" && Array.isArray(b.content)).reduce((n, b) => n + b.content.length, 0);
    if (res.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: res.content });
      continue;
    }
    if (res.stop_reason !== "end_turn") return "";
    // without real search results the "facts" would come from memory: not good enough for money questions
    if (!hits) {
      console.warn(`[questions] research for ${catName}/${topic}: no search results came back`);
      return "";
    }
    return res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  }
  return "";
}

// ---------- research cache ----------
// Web search is ~85% of an AI match's cost, so a topic is researched once and its facts are saved. Later matches
// reuse them (no search) until they stop producing new questions; then that topic is researched again.
const FACTS_MAX_AGE_MS = 30 * 24 * 3600_000; // facts that can change get fresh research at least monthly
const factsCache = new Map(); // `${category}|${topic}` -> { id, category, topic, facts, at, uses, spent }
for (const row of kvRows) if (row.id?.startsWith("facts-")) factsCache.set(`${row.category}|${row.topic}`, row);

const FACTS_MAX_USES = 6; // after this many matches a topic's facts are worn out anyway
const usableFacts = (f) => !!f && !f.spent && f.uses < FACTS_MAX_USES && Date.now() - f.at < FACTS_MAX_AGE_MS;
const saveFacts = (f) => store.enabled && store.queue("kv", { ...f });

// A topic for this match: one that already has saved research (no search needed), else the next in the rotation.
function pickTopic(category) {
  const ready = SUBTOPICS[category].filter((t) => usableFacts(factsCache.get(`${category}|${t}`)));
  return ready.length ? ready[crypto.randomInt(ready.length)] : nextTopic(category);
}

async function factsFor(category, catName, topic) {
  const key = `${category}|${topic}`;
  const cached = factsCache.get(key);
  if (usableFacts(cached)) {
    cached.uses++;
    saveFacts(cached);
    console.log(`[questions] ${category}/${topic}: saved research reused (use ${cached.uses}) — no web search`);
    return cached;
  }
  const facts = await research(catName, topic);
  if (!facts) return null;
  const entry = { id: "facts-" + hashId(category, topic), category, topic, facts, at: Date.now(), uses: 1, spent: false };
  factsCache.set(key, entry);
  saveFacts(entry);
  return entry;
}

const topicCursor = {};
// Web research runs for every match (accurate hard questions). Set AI_WEB_RESEARCH=false to turn it off.
const WEB_RESEARCH = process.env.AI_WEB_RESEARCH !== "false";
const SPARE = 10; // extra questions so the match still has 10 after the fact-check drops doubtful ones

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

// Research (web) -> write questions -> fact-check. If too few pass, one more write + check round runs on the
// same research (no new searches). Returns accepted, unused questions.
async function generateForMatch(category, count) {
  const topic = WEB_RESEARCH ? pickTopic(category) : nextTopic(category);
  const catName = CATEGORIES.find((c) => c.id === category).name;
  const saved = WEB_RESEARCH ? await factsFor(category, catName, topic) : null;
  const facts = saved?.facts ?? "";
  if (WEB_RESEARCH && !facts) return []; // the match is filled from stored questions instead
  const source = facts
    ? "Build every question ONLY on the researched facts you are given. Never invent a fact."
    : "You have no web access: use ONLY facts you are completely certain of (long-documented records, dates, numbers, details). Never guess or invent a fact.";
  const system = GEN_SYSTEM.replace("Build every question ONLY on the researched facts you are given. Never invent a fact.", source);
  // questions already used anywhere in this category — the model must not repeat them
  const used = (pool[category] || []).filter((q) => q.used).slice(-60).map((q) => "- " + q.q).join("\n") || "(none yet)";

  const accepted = [];
  const tried = [];
  for (let round = 0; round < 2 && accepted.length < count; round++) {
    const want = count - accepted.length + SPARE;
    const avoid = tried.length ? `\n\nThese were already written for this match; use DIFFERENT facts:\n${tried.map((q) => "- " + q).join("\n")}` : "";
    const gen = await client.messages.parse({
      model: MODEL,
      max_tokens: 3500,
      thinking: NO_THINKING,
      output_config: { effort: "medium", format: zodOutputFormat(GeneratedSchema) },
      system,
      messages: [{
        role: "user",
        content: `Category: ${catName}\nFocus topic: ${topic}\n${CATEGORY_RULES[category] ? `Extra rules: ${CATEGORY_RULES[category]}\n` : ""}${facts ? `\nRESEARCHED FACTS:\n${facts}\n` : ""}
Write ${want} questions, every one at the hardest expert level, each with exactly 3 wrong answers.

These questions were already used and must never be repeated or rephrased:
${used}${avoid}`,
      }],
    });
    track(gen, "generate");
    if (gen.stop_reason !== "end_turn" || !gen.parsed_output) {
      console.warn(`[questions] generation for ${category} stopped: ${gen.stop_reason}`);
      break;
    }

    const batchNorms = new Set();
    const candidates = gen.parsed_output.questions.filter((q) => {
      const n = norm(q.question);
      const answers = [q.correct_answer, ...q.wrong_answers].map(norm);
      const ok = q.wrong_answers.length === 3 && new Set(answers).size === 4 && !allNorms.has(n) && !batchNorms.has(n);
      batchNorms.add(n);
      return ok;
    });
    tried.push(...gen.parsed_output.questions.map((q) => q.question));
    if (!candidates.length) {
      console.warn(`[questions] ${category}: AI returned ${gen.parsed_output.questions.length} questions, none usable (bad options or already exist)`);
      continue;
    }

    const listing = candidates
      .map((q, i) => `${i + 1}. ${q.question}\n   Correct: ${q.correct_answer}\n   Wrong: ${q.wrong_answers.join(" | ")}`)
      .join("\n");
    const check = await client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
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
      continue;
    }

    const verdicts = check.parsed_output.verdicts;
    const okNumbers = new Set(verdicts.filter((v) => v.ok).map((v) => v.number));
    const passed = candidates
      .filter((_, i) => okNumbers.has(i + 1))
      .map((q) => ({
        id: hashId(category, q.question), q: q.question, correct: q.correct_answer, wrong: q.wrong_answers,
        difficulty: q.difficulty, source: "ai-match", web: !!facts, topic, v: 2, at: Date.now(),
      }));
    for (const q of passed) allNorms.add(norm(q.q));
    pool[category].push(...passed);
    savePool(category, passed);
    accepted.push(...passed);
    const problems = verdicts.filter((v) => !v.ok && v.problem).slice(0, 3).map((v) => v.problem);
    console.log(
      `[questions] ${category}/${topic} round ${round + 1}: ${passed.length}/${candidates.length} passed the fact-check (${gen.parsed_output.questions.length} written)` +
        (problems.length ? ` — rejected e.g.: ${problems.join(" | ")}` : ""),
    );
  }
  // reused facts that no longer fill a match are running out: research the topic again next time.
  // (A first use that falls short just had a strict fact-check; those facts get another go.)
  if (saved && saved.uses >= 2 && accepted.length < count) {
    saved.spent = true;
    saveFacts(saved);
  }
  return accepted;
}

// One AI run per match. Started as soon as a player joins the queue (prefetch), consumed when the match starts.
const prepared = new Map(); // category -> Promise<accepted questions>

function produce(category, count) {
  if (!client || aiDisabledReason) return Promise.resolve([]);
  if (overDailyCap()) {
    console.warn(`[questions] daily AI cap reached (${usage.batches} matches, $${usage.usd.toFixed(2)}) — stored questions only`);
    return Promise.resolve([]);
  }
  usage.batches++;
  const usdBefore = usage.usd;
  const started = Date.now();
  return generateForMatch(category, count)
    .catch((err) => {
      handleAiError(err);
      return [];
    })
    .then((items) => {
      console.log(`[questions] ${category}: AI run done in ${((Date.now() - started) / 1000).toFixed(1)}s, ≈ $${(usage.usd - usdBefore).toFixed(4)}`);
      return items;
    });
}

// Called when a player joins a queue: start this category's AI run early to hide the wait.
export function prefetch(category, count) {
  if (LOCAL.has(category) || prepared.has(category)) return;
  console.log(`[questions] ${category}: AI run started for the lobby`);
  prepared.set(category, produce(category, count));
}

// Called when a match starts. Never returns a question that was used before, anywhere.
// deadlineAt: if the AI isn't done by then, the match starts with stored questions; the AI run keeps going in the
// background and its questions stay in the pool for later matches.
export async function questionsForMatch(category, count, deadlineAt = Infinity) {
  if (category === "math") return Array.from({ length: count }, (_, i) => mathQuestion(i));
  if (PUZZLE_KINDS.includes(category)) {
    const rounds = [];
    for (let i = 0; i < count; i++) rounds.push(await puzzleRound(category, i));
    return rounds;
  }
  const started = Date.now();
  const run = prepared.get(category) ?? produce(category, count);
  prepared.delete(category);
  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(null), Math.max(0, deadlineAt - Date.now())); });
  const done = await Promise.race([run, timeout]);
  clearTimeout(timer);
  if (!done) console.warn(`[questions] ${category}: AI not ready by the lobby limit — starting with stored questions`);
  const fresh = (done || []).filter((q) => !q.used);
  let items = fresh.slice(0, count);
  const fromAi = items.length;
  // this run's own questions are already in the pool, so leave them out of the top-up
  if (items.length < count) items = [...items, ...storedUnused(category, count - items.length, items)];
  markUsed(items);
  console.log(`[match-questions] ${category}: ${fromAi} new + ${items.length - fromAi} stored unused, ready ${((Date.now() - started) / 1000).toFixed(1)}s after match start`);
  return shuffle(items).map(toMatchQuestion);
}

export function aiStatus() {
  return aiDisabledReason ? `off (${aiDisabledReason})` : `on (${MODEL}, per match${WEB_RESEARCH ? " with web research" : ""})`;
}

// Nothing runs in the background; kept so the server can log the setup.
export function warmUp() {
  console.log(`[questions] AI runs per match (prefetched when a player joins a queue). Daily cap: ${DAILY_BATCH_CAP} runs or $${DAILY_COST_CAP}.`);
}
