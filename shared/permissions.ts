export type Permission = 
  | 'dashboard'
  | 'inventory'
  | 'menu'
  | 'recipes'
  | 'branches'
  | 'procurement'
  | 'pos'
  | 'orders'
  | 'kitchen'
  | 'sales'
  | 'reports'
  | 'customers'
  | 'settings'
  | 'users'
  | 'workingHours'
  | 'bills'
  | 'deliveryApps'
  | 'licenses';

export const ALL_PERMISSIONS: Permission[] = [
  'dashboard',
  'inventory',
  'menu',
  'recipes',
  'branches',
  'procurement',
  'pos',
  'orders',
  'kitchen',
  'sales',
  'reports',
  'customers',
  'settings',
  'users',
  'workingHours',
  'bills',
  'deliveryApps',
  'licenses',
];

export type PermissionSet = Record<Permission, boolean>;

export const ADMIN_PERMISSIONS: PermissionSet = {
  dashboard: true,
  inventory: true,
  menu: true,
  recipes: true,
  branches: true,
  procurement: true,
  pos: true,
  orders: true,
  kitchen: true,
  sales: true,
  reports: true,
  customers: true,
  settings: true,
  users: true,
  workingHours: true,
  bills: true,
  deliveryApps: true,
  licenses: true,
};

export const DEFAULT_EMPLOYEE_PERMISSIONS: PermissionSet = {
  dashboard: false,
  inventory: false,
  menu: false,
  recipes: false,
  branches: false,
  procurement: false,
  pos: true,
  orders: true,
  kitchen: true,
  sales: false,
  reports: false,
  customers: true,
  settings: false,
  users: false,
  workingHours: false,
  bills: false,
  deliveryApps: false,
  licenses: false,
};

export type PermissionMode = 'any' | 'all';

export interface PermissionRequirement {
  mode: PermissionMode;
  permissions: Permission[];
}

export const ROUTE_PERMISSIONS: Record<string, PermissionRequirement> = {
  '/api/dashboard': { mode: 'any', permissions: ['dashboard'] },
  '/api/inventory': { mode: 'any', permissions: ['inventory'] },
  '/api/menu': { mode: 'any', permissions: ['menu'] },
  '/api/recipes': { mode: 'any', permissions: ['recipes'] },
  '/api/branches': { mode: 'any', permissions: ['branches'] },
  '/api/procurement': { mode: 'any', permissions: ['procurement'] },
  '/api/pos': { mode: 'any', permissions: ['pos'] },
  '/api/orders': { mode: 'any', permissions: ['orders'] },
  '/api/kitchen': { mode: 'any', permissions: ['kitchen'] },
  '/api/sales': { mode: 'any', permissions: ['sales'] },
  '/api/reports': { mode: 'any', permissions: ['reports'] },
  '/api/customers': { mode: 'any', permissions: ['customers'] },
  '/api/settings': { mode: 'any', permissions: ['settings'] },
  '/api/users': { mode: 'any', permissions: ['users'] },
  '/api/working-hours': { mode: 'any', permissions: ['workingHours'] },
  '/api/bills': { mode: 'any', permissions: ['bills'] },
  '/api/chat': { mode: 'any', permissions: ['dashboard'] },
};

export function hasPermission(userPermissions: PermissionSet | undefined, userRole: string, permission: Permission): boolean {
  if (userRole === 'admin') return true;
  return userPermissions?.[permission] === true;
}

export function hasAnyPermission(userPermissions: PermissionSet | undefined, userRole: string, ...permissions: Permission[]): boolean {
  if (userRole === 'admin') return true;
  if (!userPermissions) return false;
  return permissions.some(p => userPermissions[p] === true);
}

export function hasAllPermissions(userPermissions: PermissionSet | undefined, userRole: string, ...permissions: Permission[]): boolean {
  if (userRole === 'admin') return true;
  if (!userPermissions) return false;
  return permissions.every(p => userPermissions[p] === true);
}
