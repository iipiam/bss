// Regenerates server/schema-sync.sql from the current development database.
// Run after any schema change (npm run db:push) so production stays aligned:
//   node scripts/generate-schema-sync.mjs
import pg from "pg";
import fs from "fs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const tables = (
  await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> 'session'
     ORDER BY 1`
  )
).rows.map((r) => r.table_name);

const cols = (
  await pool.query(
    `SELECT table_name, column_name, data_type, udt_name, character_maximum_length,
            numeric_precision, numeric_scale, is_nullable, column_default
     FROM information_schema.columns WHERE table_schema='public'
     ORDER BY table_name, ordinal_position`
  )
).rows;

const pks = (
  await pool.query(
    `SELECT tc.table_name, kcu.column_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_schema='public'`
  )
).rows;

const pkMap = {};
for (const r of pks) (pkMap[r.table_name] = pkMap[r.table_name] || []).push(r.column_name);

function typeOf(c) {
  if (c.data_type === "ARRAY") return c.udt_name.replace(/^_/, "") + "[]";
  if (c.data_type === "character varying")
    return c.character_maximum_length ? `varchar(${c.character_maximum_length})` : "varchar";
  if (c.data_type === "numeric" && c.numeric_precision)
    return `numeric(${c.numeric_precision},${c.numeric_scale})`;
  if (c.data_type === "USER-DEFINED") return c.udt_name;
  return c.data_type;
}

const out = [];
const seqs = new Set();
for (const t of tables) {
  const tc = cols.filter((c) => c.table_name === t);
  const lines = tc.map((c) => {
    let d = `  "${c.column_name}" ${typeOf(c)}`;
    if (c.column_default) {
      const m = c.column_default.match(/nextval\('([^']+)'/);
      if (m) seqs.add(m[1]);
      d += ` DEFAULT ${c.column_default}`;
    }
    if (c.is_nullable === "NO") d += " NOT NULL";
    return d;
  });
  if (pkMap[t]) lines.push(`  PRIMARY KEY (${pkMap[t].map((c) => `"${c}"`).join(", ")})`);
  out.push(`CREATE TABLE IF NOT EXISTS "${t}" (\n${lines.join(",\n")}\n);`);
  for (const c of tc) {
    let d = `ALTER TABLE "${t}" ADD COLUMN IF NOT EXISTS "${c.column_name}" ${typeOf(c)}`;
    if (c.column_default) d += ` DEFAULT ${c.column_default}`;
    // Only enforce NOT NULL on ADD COLUMN when there is a default (safe for existing rows)
    if (c.is_nullable === "NO" && c.column_default) d += " NOT NULL";
    out.push(d + ";");
  }
}
const seqSql = [...seqs].map((s) => `CREATE SEQUENCE IF NOT EXISTS ${s.replace(/^"|"$/g, "")};`);
fs.writeFileSync("server/schema-sync.sql", [...seqSql, ...out].join("\n") + "\n");
console.log(`schema-sync.sql written: ${tables.length} tables, ${seqSql.length + out.length} statements`);
await pool.end();
