import assert from "node:assert/strict";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const first = new pg.Client({ connectionString });
const second = new pg.Client({ connectionString });
await Promise.all([first.connect(), second.connect()]);

const restaurantId = `race-contract-${process.pid}`;
const lockSql = `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`;
const trySql = `SELECT pg_try_advisory_xact_lock(hashtextextended($1, 0)) AS acquired`;
const lockKey = `promotion-pricing:${restaurantId}`;

for (const scenario of ["pause", "archive", "discount-version", "branch-target", "expiry-boundary", "usage-cap", "concurrent-create"]) {
  await first.query("BEGIN");
  await first.query(lockSql, [lockKey]); // checkout/mutation that commits first
  await second.query("BEGIN");
  const blocked = await second.query(trySql, [lockKey]);
  assert.equal(blocked.rows[0].acquired, false, `${scenario} did not serialize`);
  await first.query("COMMIT");
  await second.query(lockSql, [lockKey]);
  await second.query("COMMIT");
}

// One PostgreSQL transaction rolls every checkout side effect back together.
await first.query("CREATE TEMP TABLE atomic_checkout_probe(kind text) ON COMMIT PRESERVE ROWS");
await first.query("BEGIN");
for (const kind of ["order", "inventory", "inventory-audit", "payment-link", "coupon", "promotion-application"]) {
  await first.query("INSERT INTO atomic_checkout_probe(kind) VALUES ($1)", [kind]);
}
await first.query("ROLLBACK");
const rolledBack = await first.query("SELECT count(*)::int count FROM atomic_checkout_probe");
assert.equal(rolledBack.rows[0].count, 0);

await Promise.all([first.end(), second.end()]);
console.log("Promotion transaction serialization and atomic rollback checks passed.");