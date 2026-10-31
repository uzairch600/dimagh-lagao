// Postgres (Supabase) persistence. The game keeps everything in memory for speed and
// writes changed rows through to Postgres in small batches.
// Tables live in a private "app" schema with RLS on, so Supabase's public Data API
// can't read them — only this server (connecting as the postgres role) can.
import pg from "pg";

const url = process.env.DATABASE_URL || "";
export const enabled = !!url && !url.includes("[YOUR-PASSWORD]");

const TABLES = ["users", "transactions", "matches", "withdrawals", "messages", "kv", "flags"];
let pool = null;

export async function init() {
  pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 5 });
  await pool.query("create schema if not exists app");
  for (const t of TABLES) {
    await pool.query(`create table if not exists app.${t} (id text primary key, data jsonb not null, updated_at timestamptz not null default now())`);
    await pool.query(`alter table app.${t} enable row level security`);
  }
  await pool.query(
    "create table if not exists app.questions (id text primary key, category text not null, data jsonb not null, created_at timestamptz not null default now())",
  );
  await pool.query("alter table app.questions enable row level security");
  await pool.query("create index if not exists questions_category on app.questions (category)");
  // A question may exist only once (by normalised text) across ALL categories, and is retired once used.
  await pool.query("alter table app.questions add column if not exists norm text");
  await pool.query("alter table app.questions add column if not exists used_at timestamptz");
  await pool.query("update app.questions set norm = trim(regexp_replace(lower(data->>'q'), '[^a-z0-9]+', ' ', 'g')) where norm is null");
  await pool.query("delete from app.questions a using app.questions b where a.norm = b.norm and a.ctid > b.ctid");
  await pool.query("create unique index if not exists questions_norm_unique on app.questions (norm)");
}

export async function loadAll(table) {
  const r = await pool.query(`select data from app.${table}`);
  return r.rows.map((x) => x.data);
}

const pending = new Map(); // table -> Map(id -> row)
let timer = null;

export function queue(table, row) {
  if (!pending.has(table)) pending.set(table, new Map());
  pending.get(table).set(row.id, row);
  if (!timer) timer = setTimeout(flush, 250);
}

export async function flush() {
  timer = null;
  for (const [table, rows] of [...pending]) {
    pending.delete(table);
    const list = [...rows.values()];
    for (let i = 0; i < list.length; i += 200) {
      const chunk = list.slice(i, i + 200);
      const params = chunk.map((_, j) => `($${j * 2 + 1}, $${j * 2 + 2})`).join(",");
      const values = chunk.flatMap((r) => [r.id, JSON.stringify(r)]);
      try {
        await pool.query(
          `insert into app.${table} (id, data) values ${params} on conflict (id) do update set data = excluded.data, updated_at = now()`,
          values,
        );
      } catch (err) {
        console.error(`[store] saving ${table} failed, will retry:`, err.message);
        for (const r of chunk) queue(table, r);
      }
    }
  }
}

export async function loadQuestions() {
  const r = await pool.query("select category, data, used_at from app.questions");
  const out = {};
  for (const { category, data, used_at } of r.rows) (out[category] ||= []).push({ ...data, used: !!used_at });
  return out;
}

// Retire questions forever once they have been shown in a match.
export async function markQuestionsUsed(ids) {
  if (!ids.length) return;
  await pool.query("update app.questions set used_at = coalesce(used_at, now()) where id = any($1)", [ids]);
}

export const normText = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export async function saveQuestions(category, items) {
  for (let i = 0; i < items.length; i += 200) {
    const chunk = items.slice(i, i + 200);
    const params = chunk.map((_, j) => `($${j * 4 + 1}, $${j * 4 + 2}, $${j * 4 + 3}, $${j * 4 + 4})`).join(",");
    const values = chunk.flatMap((q) => [q.id, category, normText(q.q), JSON.stringify(q)]);
    // duplicates (same id or same normalised text) are silently skipped
    await pool.query(`insert into app.questions (id, category, norm, data) values ${params} on conflict do nothing`, values);
  }
}
