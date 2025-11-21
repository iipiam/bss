import 'express-session';
import type { PermissionSet } from '@shared/permissions';

export interface AuthUser {
  id: string;
  username: string;
  restaurantId?: string; // CRITICAL: Multi-tenant isolation - undefined for IT accounts (null in DB), string for client accounts
  role: string; // User role (admin, employee, etc.)
  email: string;
  fullName: string;
  branchId: string;
  isMainAccount: boolean;
  devicePreference: 'laptop' | 'ipad' | 'iphone';
  permissions: PermissionSet;
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
