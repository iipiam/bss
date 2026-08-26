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

const overviewTables = [
  "overview_settings", "waste_logs", "cash_accounts", "cash_ledger_entries",
  "cash_obligations", "work_schedules", "work_time_entries", "employment_exits",
  "loyalty_accounts", "loyalty_transactions", "zatca_retry_attempts",
  "overview_daily_snapshots",
];
const overviewForeignKeys = (
  await pool.query(
    `SELECT c.conname, c.conrelid::regclass::text AS table_name,
            pg_get_constraintdef(c.oid) AS definition
       FROM pg_constraint c
      WHERE c.contype = 'f'
        AND c.connamespace = 'public'::regnamespace
        AND c.conrelid::regclass::text = ANY($1::text[])
      ORDER BY c.conrelid::regclass::text, c.conname`,
    [overviewTables]
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
// The generic introspection output intentionally avoids replaying arbitrary
// foreign keys against legacy data.  These overview indexes are safe,
// idempotent, and preserve the tenant/branch lookup and uniqueness contract
// even when the tables were originally created by an older schema-sync file.
const overviewIntegrity = [
  `CREATE UNIQUE INDEX IF NOT EXISTS overview_settings_branch_unique ON overview_settings (restaurant_id, branch_id);`,
  `CREATE INDEX IF NOT EXISTS cash_accounts_branch_idx ON cash_accounts (restaurant_id, branch_id);`,
  `CREATE INDEX IF NOT EXISTS waste_logs_branch_occurred_idx ON waste_logs (restaurant_id, branch_id, occurred_at);`,
  `CREATE INDEX IF NOT EXISTS cash_ledger_account_occurred_idx ON cash_ledger_entries (restaurant_id, branch_id, account_id, occurred_at);`,
  `CREATE INDEX IF NOT EXISTS cash_obligations_due_idx ON cash_obligations (restaurant_id, branch_id, due_date);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS work_schedules_employee_date_unique ON work_schedules (restaurant_id, branch_id, employee_id, scheduled_date);`,
  `CREATE INDEX IF NOT EXISTS work_time_employee_started_idx ON work_time_entries (restaurant_id, branch_id, employee_id, started_at);`,
  `CREATE INDEX IF NOT EXISTS employment_exits_branch_date_idx ON employment_exits (restaurant_id, branch_id, exit_date);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS loyalty_accounts_customer_unique ON loyalty_accounts (restaurant_id, customer_id);`,
  `CREATE INDEX IF NOT EXISTS loyalty_transactions_account_occurred_idx ON loyalty_transactions (restaurant_id, branch_id, loyalty_account_id, occurred_at);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS zatca_retry_attempt_key_unique ON zatca_retry_attempts (restaurant_id, invoice_id, idempotency_key);`,
  ...overviewForeignKeys.map(({ conname, table_name, definition }) => {
    const constraint = conname.replaceAll('"', '""');
    const table = table_name.replaceAll('"', '""');
    // Keep each DO block on one physical line: db.ts's schema-sync statement
    // splitter treats only semicolon+newline as a statement boundary.
    return `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${conname.replaceAll("'", "''")}' AND conrelid = '"${table}"'::regclass) THEN ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" ${definition} NOT VALID; END IF; END $$;`;
  }),
];
fs.writeFileSync("server/schema-sync.sql", [...seqSql, ...out, ...overviewIntegrity].join("\n") + "\n");
console.log(`schema-sync.sql written: ${tables.length} tables, ${seqSql.length + out.length} statements`);
await pool.end();
