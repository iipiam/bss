# BSS — Azure VM Deployment Guide

This is the operator-facing guide for deploying BSS to the Azure VM behind
`kinbss.org`. If the site is showing **502 Bad Gateway**, jump to
[Recovering from 502](#recovering-from-502).

---

## Architecture (the short version)

```
  Internet ──HTTPS──▶  nginx (:443)  ──proxy_pass──▶  Node/PM2 (:5000)  ──▶  AWS RDS Postgres
```

| Piece     | Where it lives                          |
| --------- | --------------------------------------- |
| App code  | `/home/<user>/bss` on the VM (git repo) |
| Process   | PM2 process named **`BSS`** (one only)  |
| Port      | `PORT=5000` (Node listens on `0.0.0.0`) |
| Reverse proxy | nginx, `proxy_pass http://127.0.0.1:5000;` |
| Database  | AWS RDS Postgres (URL in `.env`)        |

---

## Environment variables — canonical location

**All secrets live in a single file:** `<repo-root>/.env`

`deploy.sh` sources that file before doing anything else, and PM2 inherits the
environment via `pm2 restart BSS --update-env`. **Do not** also set secrets in
`~/.bashrc` or in a `pm2 ecosystem.config.cjs` — pick one place and keep it
there so there is no ambiguity about which value PM2 actually sees.

Required variables:

| Variable        | Required | Notes                                                    |
| --------------- | -------- | -------------------------------------------------------- |
| `DATABASE_URL`  | **yes**  | Full `postgres://user:pass@host:5432/db?sslmode=require` |
| `SESSION_SECRET`| yes (prod) | Any long random string. Without it sessions are insecure. |
| `PORT`          | no       | Defaults to `5000`. Must match the nginx upstream.       |
| `NODE_ENV`      | no       | Set to `production` for prod (PM2 `start` does this).    |
| `RESEND_API_KEY`| optional | Password-reset emails. App boots fine without it.        |
| Geidea / ZATCA secrets | optional | Each integration logs a warning and stays disabled if its secrets are missing. |

Minimal `.env`:

```env
DATABASE_URL=postgres://bss_user:REDACTED@bss-prod.xxxx.eu-central-1.rds.amazonaws.com:5432/bss?sslmode=require
SESSION_SECRET=please-replace-with-64-random-chars
PORT=5000
NODE_ENV=production
```

---

## nginx config (reference)

The nginx server block for `kinbss.org` must proxy to the same port the Node
app listens on. Default is `5000`:

```nginx
server {
    server_name kinbss.org www.kinbss.org;
    listen 443 ssl http2;
    # ... ssl_certificate / ssl_certificate_key ...

    client_max_body_size 20m;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # WebSocket upgrade (used by BSS for real-time notifications)
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_read_timeout 300s;
    }
}
```

After changing nginx: `sudo nginx -t && sudo systemctl reload nginx`.

---

## The one-liner deploy

From the repo root on the VM:

```bash
./deploy.sh
```

That script does, in order:

1. Sources `.env` and verifies `DATABASE_URL` is set.
2. `git pull --ff-only` (aborts if the working tree is dirty).
3. `npm ci` (or `npm install` if no lockfile).
4. **PDF engine check** — runs `node scripts/check-pdf-engine.mjs`, which
   launches headless Chromium and renders a test PDF. Every invoice, report,
   and quotation PDF depends on this. If it fails, the script self-heals:
   first `npx puppeteer browsers install chrome` (downloaded into
   `.puppeteer-cache/` in the repo), then — if passwordless sudo is available —
   `apt-get install -y chromium-browser` to pull in missing system libraries.
   If it still fails, the deploy aborts with manual fix instructions. The
   `PUPPETEER_CACHE_DIR` env var is exported so PM2 inherits it via
   `--update-env`.
5. `npm run db:push` — pushes the latest Drizzle schema to RDS. *(The app
   also runs idempotent `CREATE TABLE IF NOT EXISTS` migrations at boot for
   the tables added in recent releases, so a partial `db:push` won't crash
   the server.)*
6. `npm run build` (Vite + esbuild).
7. Removes any stale PM2 processes whose name is not `BSS`, then
   `pm2 restart BSS --update-env` (or starts it if missing).
8. `pm2 save`.
9. Waits 4 s and runs `curl http://127.0.0.1:5000/` — fails loudly if the app
   did not come up, and prints the last 40 log lines so you can see why.

Skip flags (rarely needed):

- `./deploy.sh --no-build` — config-only change, reuse `dist/`.
- `./deploy.sh --no-migrate` — schema unchanged, skip `db:push`.
- `./deploy.sh --no-pdf-check` — deploy even if the PDF engine is broken
  (NOT recommended — all PDF downloads will fail as blank files).

### PDF downloads come back blank / empty

The server renders PDFs with headless Chromium (Puppeteer). A blank or broken
downloaded file means the browser failed to launch on the VM. Diagnose with:

```bash
cd ~/bss && node scripts/check-pdf-engine.mjs
pm2 logs BSS --lines 40 --nostream   # look for "Browser launch failed"
```

Fix with ONE of:

```bash
sudo apt-get install -y chromium-browser        # easiest — installs all libs
npx puppeteer browsers install chrome           # no sudo, may lack system libs
```

Then `pm2 restart BSS --update-env` (or just re-run `./deploy.sh`, which now
performs this check automatically).

---

## Recovering from 502

A 502 means nginx is up but cannot reach the Node app on `127.0.0.1:5000`.
Almost always one of: the app crashed on boot, two PM2 processes are fighting
over the port, or env vars aren't loaded. Run these on the VM:

```bash
cd ~/bss   # or wherever the repo lives

# 1. See the current PM2 state. If there are multiple processes, that's a problem.
pm2 status

# 2. Nuke duplicates — keep only "BSS".
pm2 list | awk 'NR>3 && $2!="BSS" && $2!="" {print $2}' | xargs -r -n1 pm2 delete

# 3. Make sure env vars are loaded from the canonical location.
test -f .env && echo "✓ .env present" || echo "✗ .env MISSING — create it (see above)"
grep -q '^DATABASE_URL=' .env && echo "✓ DATABASE_URL set" || echo "✗ DATABASE_URL missing"

# 4. Run the full deploy (which restarts BSS with --update-env and health-checks it).
./deploy.sh

# 5. Confirm the app is actually serving before blaming nginx:
curl -i http://127.0.0.1:5000/ | head -n 5
# Expect: HTTP/1.1 200 OK
```

If `curl localhost:5000` returns 200 but `https://kinbss.org` still returns
502, the issue is nginx (wrong upstream port, or nginx is using a cached bad
upstream). Reload nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Rollback

If a deploy makes things worse:

```bash
# 1. Find the previous good commit.
git log --oneline -n 5

# 2. Roll back to it (deploy.sh prints the previous commit before pulling).
git reset --hard <previous-commit-sha>

# 3. Redeploy.
./deploy.sh
```

Database schema changes are forward-compatible (the new release only adds
tables/columns), so a code rollback does not require a DB rollback.

---

## Quick health checklist

After any deploy, all four of these should be true:

- [ ] `pm2 status` shows **one** `BSS` process, `online`, restart count low (< 5).
- [ ] `curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5000/` → `200`.
- [ ] `curl -sI https://kinbss.org/ | head -n 1` → `HTTP/2 200`.
- [ ] `pm2 logs BSS --lines 50 --nostream` shows `serving on port 5000` and no
      repeating stack traces.
