import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// SECURITY: This middleware bootstraps restaurantId from session
// It's the ONLY place that bypasses multi-tenant filtering
// This will be removed in Task 12 when login stores restaurantId in session

declare module "express-session" {
  interface SessionData {
    userId?: string;
    role?: string;
    restaurantId?: string; // Will be populated by this middleware temporarily
  }
}

declare global {
  namespace Express {
    interface Request {
      restaurantId?: string;
      currentUser?: any;
    }
  }
}

export async function requireTenantAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check session exists
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // If restaurantId and role already in session (Task 12), use them
    if (req.session.restaurantId && req.session.role) {
      req.restaurantId = req.session.restaurantId;
      // Populate currentUser from session data
      req.currentUser = {
        id: req.session.userId,
        role: req.session.role,
        restaurantId: req.session.restaurantId
      };
      return next();
    }

    // BOOTSTRAP: Load user to get restaurantId (temporary until Task 12)
    // SECURITY: This is the ONLY query that bypasses multi-tenant filtering
    // It ONLY uses the authenticated session userId
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.active) {
      return res.status(401).json({ error: "User account is inactive" });
    }

    // Cache restaurantId AND role in session for next request
    req.session.restaurantId = user.restaurantId;
    req.session.role = user.role;

    // Expose to route handlers
    req.restaurantId = user.restaurantId;
    req.currentUser = user;

    next();
  } catch (error) {
    console.error("[AUTH MIDDLEWARE] Error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

// Optional: Middleware for routes that also need admin role
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  await requireTenantAuth(req, res, () => {
    if (req.currentUser?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  });
}
