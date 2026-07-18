---
name: BSS PDF logos & shared Puppeteer browser
description: How logos are embedded in PDFs and why --single-process broke the shared browser
---

## Logo embedding in PDFs
- Use `buildLogoHTML(logoPath, opts)` (exported from server/invoice.ts) for any new PDF header. It handles both data:image URLs (BizFlow company_settings.companyLogo) and file paths like `/uploads/logos/...` (restaurant settings.logoPath, files live under `public/`).
- **Why:** it inlines base64 so Puppeteer never needs network access, and it enforces security (canonical-prefix check under `public/`, image-extension allowlist, strict data-URL regex). Do not hand-roll file reads for logos — that reintroduces path traversal risk.
- BizFlow/service-business docs should prefer `company_settings.companyLogo`, falling back to `settings.logoPath` (see `resolvePdfLogo` in routes.ts).

## Shared Puppeteer browser flakiness
- The shared `getBrowser()` instance must NOT be launched with `--single-process`/`--no-zygote`: with those flags, `page.close()` kills the whole browser process, so every second PDF request failed with "Connection closed"/"Navigating frame was detached" (alternating 200/500).
- Also keep `await page.close().catch(() => {})` in finally blocks — a throw in `finally` masks a successful PDF return and turns it into a 500.
- **How to apply:** any new PDF generator using the shared browser should follow this pattern; per-request `launchChromium()` + `browser.close()` routes may keep the flags.
