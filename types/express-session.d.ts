import 'express-session';

export interface AuthUser {
  id: string;
  username: string;
  restaurantId: string; // CRITICAL: Multi-tenant isolation - all queries must filter by this
  role: string; // User role (admin, employee, etc.)
  email: string;
  fullName: string;
  branchId: string;
  isMainAccount: boolean;
  devicePreference: 'laptop' | 'ipad' | 'iphone';
}

declare module 'express-session' {
  interface SessionData {
    user?: AuthUser;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
