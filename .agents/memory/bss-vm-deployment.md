---
name: BSS VM deployment
description: How the BSS production app is deployed on its self-managed VM (separate from Replit dev env)
---

BSS production runs on a **self-managed VM at `/home/BSS`** (NOT Replit
deployments), managed by **pm2 + git**. The Replit env is dev only.

**Process manager:** pm2 with `ecosystem.config.cjs`, which parses `/home/BSS/.env`.
The `.env` must contain `NODE_ENV=production`, `PORT=3000`, and `DATABASE_URL`
(no surrounding quotes). DB is AWS RDS PostgreSQL.

**Repeatable deploy:**
`cd /home/BSS && git fetch origin && git reset --hard origin/main && npm install && npm run build && pm2 restart BSS --update-env`

**Gotchas seen before:**
- "process not registered" → start with `pm2 start ecosystem.config.cjs` (not `pm2 start BSS`).
- DATABASE_URL missing → it's read from `/home/BSS/.env` by the ecosystem file.
- EADDRINUSE on 3000 → kill the stale node process first.
- Auto-start on reboot: `pm2 startup systemd` (run the printed sudo cmd) then `pm2 save`.

**Build warnings to ignore:** "chunks larger than 500 kB" are perf hints, not errors.
