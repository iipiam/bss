import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { scheduleSignupDraftCleanup } from "./cron/cleanupSignupDrafts";

const app = express();

// Conditional session store (Task 12: Production-ready with fallback)
let sessionStore: any;
if (process.env.DATABASE_URL) {
  const PgStore = connectPgSimple(session);
  const pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  sessionStore = new PgStore({
    pool: pgPool,
    tableName: 'session',
    createTableIfMissing: true,
  });
  console.log('[SESSION] Using PostgreSQL session store');
} else {
  // PRODUCTION GUARD: Fail fast if production without DATABASE_URL
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: DATABASE_URL required in production for persistent session storage');
  }
  console.warn('[SESSION] DATABASE_URL not set, using in-memory session store (NOT FOR PRODUCTION)');
  sessionStore = undefined; // undefined means use default MemoryStore
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    role?: string;
    restaurantId?: string; // Task 12: Store restaurantId in session
  }
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// PRODUCTION GUARD: Require SESSION_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('FATAL: SESSION_SECRET required in production for secure session encryption');
}

// Session middleware with conditional store (Task 12: Production-ready session persistence)
app.use(session({
  store: sessionStore, // PostgreSQL if DATABASE_URL set, otherwise MemoryStore
  secret: process.env.SESSION_SECRET || 'resto-pos-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

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
  const server = await registerRoutes(app);

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
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Schedule cron jobs
  scheduleSignupDraftCleanup();

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
