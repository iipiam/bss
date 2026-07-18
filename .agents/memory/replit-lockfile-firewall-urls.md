---
name: Replit firewall URLs in package-lock.json
description: npm installs in Replit can write package-firewall.replit.local URLs into the lockfile, breaking installs on the external VM
---

Installing npm packages inside Replit sometimes records `http://package-firewall.replit.local/npm/...` as the `resolved` URL in `package-lock.json`. That host only resolves inside Replit, so `npm install`/`npm ci` on the production VM fails with `EAI_AGAIN getaddrinfo package-firewall.replit.local`.

**Why:** Replit routes npm through an internal mirror; the mirror URL gets committed in the lockfile.

**How to apply:** After installing new packages (before the user deploys to the VM), check and fix:
```
grep -c 'package-firewall.replit.local' package-lock.json
sed -i 's|http://package-firewall.replit.local/npm/|https://registry.npmjs.org/|g' package-lock.json
```
Only the `resolved` URLs change; integrity hashes stay valid. Same one-liner works as an emergency fix directly on the VM.
