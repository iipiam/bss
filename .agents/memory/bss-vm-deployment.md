---
name: BSS VM deployment
description: How the BSS production app is deployed on its self-managed VM (separate from Replit dev env)
---

BSS production runs on a **self-managed VM** (NOT Replit deployments), managed by
**pm2 + git**. The Replit env is dev only. Authoritative source of truth: the
repo-root `deploy.sh` and `DEPLOYMENT.md` — trust them over this note if they ever diverge.

**Canonical deploy:** run `./deploy.sh` from the repo root (one-shot: pull → `npm ci`/install → `npm run db:push` → `npm run build` → pm2 restart; aborts on first failed step). Flags: `--no-build` (config-only), `--no-migrate` (schema unchanged).

**Process manager:** pm2, exactly **one** process named **`BSS`** (uppercase). There is **no** `ecosystem.config.cjs` — `deploy.sh` `source`s the repo-root `.env` and runs `pm2 start npm --name BSS --update-env -- run start` (first time) or `pm2 restart BSS --update-env`. Then `pm2 save`.
- Logs: `pm2 logs BSS --lines 40 --nostream`. Status: `pm2 status`.

**Networking / env:** nginx :443 → Node/pm2 on **`PORT=5000`** (0.0.0.0) → AWS RDS Postgres. `.env` (repo root) needs `DATABASE_URL` (no quotes); set `NODE_ENV=production` (pm2 `run start` handles this). Keep secrets in ONE place (the `.env`), not also `~/.bashrc`.

**Rollback:** `git reset --hard <prev-commit> && ./deploy.sh`.

**PDF engine:** all server PDFs render via headless Chromium (Puppeteer). Blank downloaded PDFs on prod = browser launch failure on the VM. `deploy.sh` now runs `node scripts/check-pdf-engine.mjs` (self-heals via `npx puppeteer browsers install chrome` → apt chromium-browser; aborts deploy otherwise; `--no-pdf-check` to skip). `PUPPETEER_CACHE_DIR` pinned to repo `.puppeteer-cache/` and inherited by pm2 `--update-env`.

**Gotchas:**
- `db:push` fails on destructive change → run `npm run db:push` from a workstation with prompts, resolve, re-run `./deploy.sh`.
- "column/relation does not exist" after deploy → schema behind code; re-run `./deploy.sh` (or `npm run db:push`) then `pm2 restart BSS --update-env`.
- Auto-start on reboot: `pm2 startup systemd` (run printed sudo cmd) then `pm2 save`.
- Build "chunks larger than 500 kB" warnings are perf hints, not errors.

**Why this matters:** operator-facing in-app docs (e.g. the IT Operations Guide page) must mirror `deploy.sh` exactly — hard-coding wrong values like `pm2 ... bss` (lowercase), `/home/BSS`, `PORT=3000`, or an `ecosystem.config.cjs` flow misleads IT operators.
