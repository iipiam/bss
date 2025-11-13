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
  permissions: {
    dashboard: boolean;
    inventory: boolean;
    menu: boolean;
    recipes: boolean;
    branches: boolean;
    procurement: boolean;
    pos: boolean;
    orders: boolean;
    kitchen: boolean;
    sales: boolean;
    reports: boolean;
    customers: boolean;
    settings: boolean;
    users: boolean;
    workingHours: boolean;
    bills: boolean;
  };
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
