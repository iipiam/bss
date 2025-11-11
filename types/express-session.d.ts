import 'express-session';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  restaurantName: string;
  nationalId: string;
  taxNumber: string;
  commercialRegistration: string;
  subscriptionPlan: string;
  branchId: string;
  branchesCount: number;
  userRole: string;
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
