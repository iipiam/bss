// Smoke test for the PDF engine (Chromium/Chrome via Puppeteer).
// Mirrors the executable detection order used by server/invoice.ts:
//   1. CHROMIUM_PATH / PUPPETEER_EXECUTABLE_PATH env vars
//   2. `which chromium|chromium-browser|google-chrome|google-chrome-stable`
//   3. common Linux install paths
//   4. Puppeteer's own downloaded Chrome (PUPPETEER_CACHE_DIR aware)
// Exits 0 if a browser launches and renders a PDF, non-zero otherwise.
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer";

function detectExecutable() {
  const candidates = [];
  if (process.env.CHROMIUM_PATH) candidates.push(process.env.CHROMIUM_PATH);
  if (process.env.PUPPETEER_EXECUTABLE_PATH) candidates.push(process.env.PUPPETEER_EXECUTABLE_PATH);
  try {
    const found = execSync(
      "which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome 2>/dev/null || which google-chrome-stable 2>/dev/null",
      { encoding: "utf8" },
    ).trim();
    if (found) candidates.push(found);
  } catch {}
  candidates.push(
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/snap/bin/chromium",
    "/opt/google/chrome/chrome",
  );
  for (const p of candidates) {
    try {
      if (p && existsSync(p)) return p;
    } catch {}
  }
  // Fall back to Puppeteer's own downloaded Chrome
  try {
    const p = puppeteer.executablePath();
    if (p && existsSync(p)) return p;
  } catch {}
  return undefined;
}

const executablePath = detectExecutable();
console.log(`[pdf-check] Browser executable: ${executablePath ?? "(none found — will let Puppeteer decide)"}`);

const launchOptions = {
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--single-process",
    "--no-zygote",
  ],
};
if (executablePath) launchOptions.executablePath = executablePath;

try {
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  await page.setContent("<h1>PDF engine OK</h1>", { waitUntil: "load", timeout: 15000 });
  const pdf = await page.pdf({ format: "A4" });
  await browser.close();
  if (!pdf || pdf.length < 100) throw new Error("PDF output was empty");
  console.log(`[pdf-check] OK — rendered test PDF (${pdf.length} bytes)`);
  process.exit(0);
} catch (err) {
  console.error(`[pdf-check] FAILED: ${err.message}`);
  process.exit(1);
}
