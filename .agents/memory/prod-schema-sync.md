---
name: Production schema sync (schema-sync.sql)
description: How dev/prod schema drift is prevented in BSS — auto-generated idempotent SQL applied at startup
---

Production (AWS RDS via the VM) repeatedly failed with "relation/column does not exist" because hand-written startup migrations in server/db.ts and server/storage.ts only covered a fraction of the schema (dev gets everything via drizzle push, prod only gets what was hand-migrated).

**Fix:** `server/schema-sync.sql` — auto-generated from the dev database — contains only idempotent statements (`CREATE TABLE IF NOT EXISTS` for every table + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for every column, NOT NULL only when a default exists). It is executed statement-by-statement at startup in server/db.ts (`[SchemaSync]` log line), each failure caught individually.

**How to apply:** After any schema change, regenerate before the user deploys:
```
node scripts/generate-schema-sync.mjs
```
This means new tables/columns no longer need hand-written startup migrations — but regenerating the file after each schema change is mandatory, or prod drifts again.
