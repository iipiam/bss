import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import fs from "fs";
import { pool, startupMigrationReady } from "./db";
import { registerRoutes } from "./routes";
import { retryPendingInvoices } from "./zatca/service";
import { storage } from "./storage";
import { createEmailProvider } from "./email";
import { rebuildOverviewDailySnapshots } from "./general-overview-snapshots";

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

function serveStatic(app: express.Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

const app = express();

// Serve uploaded files (logos, etc.) from public/uploads - works in both dev and production
const uploadsPath = path.resolve(import.meta.dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));
const PgStore = connectPgSimple(session);

// Trust proxy for secure cookies behind Replit's HTTPS reverse proxy
app.set('trust proxy', 1);

// Warn if using default SESSION_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.warn('⚠️  WARNING: Using default SESSION_SECRET in production. Set SESSION_SECRET environment variable for security.');
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    role?: string;
    accountType?: "client" | "it";
  }
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  limit: '15mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Session middleware with PostgreSQL store
export const sessionParser = session({
  store: new PgStore({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'resto-pos-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

app.use(sessionParser);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // No route, scheduler, or listening socket may become available until the
  // critical Overview and ZATCA integrity controls are installed and verified.
  await startupMigrationReady;
  const server = await registerRoutes(app, sessionParser);

  // Operational cache work is intentionally its own timer: a slow rebuild must
  // never delay the compliance-critical 15 minute ZATCA sweep below.
  const rebuildOverviewSnapshots = () => rebuildOverviewDailySnapshots().catch((err) =>
    console.error("[Overview snapshots] rebuild failed:", err)
  );
  rebuildOverviewSnapshots();
  setInterval(rebuildOverviewSnapshots, 6 * 60 * 60 * 1000);

  // ── ZATCA 24-hour B2C reporting scheduler ───────────────────────────────
  // ZATCA Phase 2 requires simplified (B2C) invoices to be reported within
  // 24 hours. Sweep every 15 minutes so any invoice that failed to submit at
  // creation time (network error, ZATCA outage) is retried well within the SLA.
  const ZATCA_RETRY_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
  setInterval(async () => {
    try {
      const restaurantIds = await storage.getRestaurantsWithPendingZatcaInvoices();
      // NOTE: no early return here — the archive and CSID-expiry sweeps below must
      // run every cycle even when there are no pending invoices to retry.
      if (restaurantIds.length > 0) {
        log(`[ZATCA Scheduler] Retrying pending invoices for ${restaurantIds.length} restaurant(s)`, "zatca");
      }
      for (const restaurantId of restaurantIds) {
        try {
          const result = await retryPendingInvoices(restaurantId);
          if (result.processed > 0) {
            log(`[ZATCA Scheduler] ${restaurantId}: processed=${result.processed} ok=${result.succeeded} fail=${result.failed}`, "zatca");
          }
        } catch (err) {
          console.error(`[ZATCA Scheduler] Error retrying for ${restaurantId}:`, err);
        }
      }
    } catch (err) {
      console.error("[ZATCA Scheduler] Error during pending invoice sweep:", err);
    }

    // ── Archive sweep: copy cleared/reported signed XMLs into the 6-year archive ──
    try {
      const unarchived = await storage.getUnarchivedZatcaInvoices();
      if (unarchived.length > 0) {
        let archivedCount = 0;
        for (const row of unarchived) {
          try {
            if (!row.signedXml) continue;
            const baseDate = row.clearedAt || row.submittedAt || row.createdAt || new Date();
            const retentionExpiresAt = new Date(baseDate);
            retentionExpiresAt.setFullYear(retentionExpiresAt.getFullYear() + 6);
            // Fetch the invoice number for the archive record
            const inv = await storage.getInvoice(row.invoiceId, row.restaurantId);
            await storage.archiveZatcaXml({
              invoiceId: row.invoiceId,
              restaurantId: row.restaurantId,
              invoiceNumber: inv?.invoiceNumber || row.uuid,
              invoiceHash: row.invoiceHash,
              signedXml: row.signedXml,
              submissionStatus: row.submissionStatus as "cleared" | "reported",
              submittedAt: row.clearedAt || row.submittedAt,
              retentionExpiresAt,
            });
            archivedCount++;
          } catch (err) {
            console.error(`[ZATCA Archive] Failed to archive invoice ${row.invoiceId}:`, err);
          }
        }
        if (archivedCount > 0) {
          log(`[ZATCA Archive] Archived ${archivedCount} signed XML(s) for 6-year retention`, "zatca");
        }
      }
    } catch (err) {
      console.error("[ZATCA Archive] Error during archive sweep:", err);
    }

    // ── CSID expiry alerts: warn operators 30 days / 7 days before expiry ──
    try {
      const enabledSettings = await storage.getAllEnabledZatcaSettings();
      const now = Date.now();
      for (const s of enabledSettings) {
        if (!s.csidExpiresAt) continue;
        const daysLeft = Math.floor((new Date(s.csidExpiresAt).getTime() - now) / (24 * 60 * 60 * 1000));
        let level: "30d" | "7d" | null = null;
        if (daysLeft <= 7) level = "7d";
        else if (daysLeft <= 30) level = "30d";
        if (!level || s.csidExpiryAlertLevel === level || (level === "30d" && s.csidExpiryAlertLevel === "7d")) continue;

        // Atomic claim so overlapping sweeps / multiple instances never double-send.
        const claimed = await storage.claimCsidExpiryAlert(s.restaurantId, level);
        if (!claimed) continue;

        const expiryDateStr = new Date(s.csidExpiresAt).toISOString().slice(0, 10);
        const isCritical = level === "7d";
        const subject = isCritical
          ? `🚨 CRITICAL: ZATCA certificate expires in ${Math.max(daysLeft, 0)} day(s) — renew immediately`
          : `⚠️ ZATCA certificate expires on ${expiryDateStr} — renew within 30 days`;
        const bodyText =
          `The ZATCA production certificate (CSID) for restaurant ${s.restaurantId} expires on ${expiryDateStr}` +
          ` (${Math.max(daysLeft, 0)} day(s) remaining).\n\n` +
          `Once it expires, ZATCA will reject ALL invoice submissions for this business.\n\n` +
          `To renew: generate a fresh OTP at fatoora.zatca.gov.sa, then use the "Renew CSID" action ` +
          `in ZATCA Settings (or POST /api/zatca/renew-csid).`;
        try {
          const provider = await createEmailProvider();
          const toEmail = process.env.IT_EMAIL || "IT@kinbss.org";
          if (provider) {
            const result = await provider.sendEmail({
              to: toEmail,
              from: process.env.EMAIL_FROM || "IT@kinbss.org",
              subject,
              text: bodyText,
              html: `<p>${bodyText.replace(/\n/g, "<br/>")}</p>`,
            });
            if (result.success) {
              log(`[ZATCA CSID Alert] ${level} expiry alert sent for restaurant ${s.restaurantId} (expires ${expiryDateStr})`, "zatca");
            } else {
              console.error(`[ZATCA CSID Alert] Email failed for ${s.restaurantId}:`, result.error);
            }
          } else {
            console.warn(`[ZATCA CSID Alert] No email provider configured; CSID for ${s.restaurantId} expires ${expiryDateStr} (${daysLeft}d left)`);
          }
          // Note: the claim above already recorded the alert level (prevents 15-min spam);
          // the settings-page banner remains the always-visible signal if email fails.
        } catch (err) {
          console.error(`[ZATCA CSID Alert] Error alerting for ${s.restaurantId}:`, err);
        }
      }
    } catch (err) {
      console.error("[ZATCA CSID Alert] Error during expiry sweep:", err);
    }
  }, ZATCA_RETRY_INTERVAL_MS);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Dynamic import to avoid bundling Replit-specific vite plugins in production
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
