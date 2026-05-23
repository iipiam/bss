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
  | 'licenses'
  | 'investors'
  | 'activityLog'
  | 'marketing'
  | 'mealSubscriptions'
  | 'catering';

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
  'investors',
  'activityLog',
  'marketing',
  'mealSubscriptions',
  'catering',
];

// Granular permission actions
export type PermissionAction = 'view' | 'add' | 'edit' | 'delete';

export const ALL_PERMISSION_ACTIONS: PermissionAction[] = ['view', 'add', 'edit', 'delete'];

// Granular permission object for each feature
export interface GranularPermission {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

// Permission can be boolean (legacy) or granular object
export type PermissionValue = boolean | GranularPermission;

// Full permission set - supports both boolean and granular permissions
export type PermissionSet = Record<Permission, PermissionValue>;

// Helper to create a full granular permission (all actions enabled)
export const FULL_GRANULAR_PERMISSION: GranularPermission = {
  view: true,
  add: true,
  edit: true,
  delete: true,
};

// Helper to create a view-only permission
export const VIEW_ONLY_PERMISSION: GranularPermission = {
  view: true,
  add: false,
  edit: false,
  delete: false,
};

// Helper to create no permission
export const NO_PERMISSION: GranularPermission = {
  view: false,
  add: false,
  edit: false,
  delete: false,
};

// Normalize permission value - converts boolean to granular or returns granular as-is
export function normalizePermission(value: PermissionValue | undefined): GranularPermission {
  if (value === undefined || value === false) {
    return { ...NO_PERMISSION };
  }
  if (value === true) {
    return { ...FULL_GRANULAR_PERMISSION };
  }
  return value;
}

// Check if a permission value allows a specific action
export function hasPermissionAction(value: PermissionValue | undefined, action: PermissionAction): boolean {
  const normalized = normalizePermission(value);
  return normalized[action] === true;
}

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
  investors: true,
  activityLog: true,
  marketing: true,
  mealSubscriptions: true,
  catering: true,
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
  investors: false,
  activityLog: false,
  marketing: false,
  mealSubscriptions: false,
  catering: false,
};

// Business types supported by the platform. Keep this in sync with the
// `businessTypes` filter in client/src/components/app-sidebar.tsx.
export type BusinessType =
  | 'restaurant'
  | 'factory'
  | 'real_estate'
  | 'design_services'
  | 'installation_services'
  | 'it_services';

// Permissions that are relevant to each business type. Derived from the
// sidebar grouping — a row is included if at least one sidebar entry for
// that business type uses that permission. Permissions used by every
// business (branches, sales, users, settings, workingHours, activityLog,
// bills, licenses, marketing, dashboard, customers) appear in every list.
//
// Used by the Employees → Permissions UI so owners only see rows that map
// to pages they actually have. Stored permission data is NOT filtered by
// this map — non-visible flags are preserved on save so switching business
// type later does not silently drop them.
export const BUSINESS_TYPE_PERMISSIONS: Record<BusinessType, Permission[]> = {
  restaurant: [
    'dashboard', 'pos', 'orders', 'kitchen', 'deliveryApps', 'mealSubscriptions',
    'catering', 'inventory', 'menu', 'recipes', 'branches', 'procurement',
    'sales', 'reports', 'customers', 'bills', 'licenses', 'investors',
    'marketing', 'activityLog', 'users', 'settings', 'workingHours',
  ],
  factory: [
    'dashboard', 'pos', 'orders', 'kitchen', 'inventory', 'menu', 'branches',
    'procurement', 'sales', 'reports', 'customers', 'bills', 'licenses',
    'investors', 'marketing', 'activityLog', 'users', 'settings', 'workingHours',
  ],
  real_estate: [
    'dashboard', 'pos', 'orders', 'menu', 'branches', 'reports', 'sales',
    'customers', 'bills', 'licenses', 'marketing', 'activityLog', 'users',
    'settings', 'workingHours',
  ],
  design_services: [
    'dashboard', 'orders', 'menu', 'customers', 'reports', 'sales', 'bills',
    'licenses', 'branches', 'marketing', 'activityLog', 'users', 'settings',
    'workingHours',
  ],
  installation_services: [
    'dashboard', 'orders', 'menu', 'customers', 'reports', 'sales', 'bills',
    'licenses', 'branches', 'marketing', 'activityLog', 'users', 'settings',
    'workingHours',
  ],
  it_services: [
    'dashboard', 'orders', 'menu', 'customers', 'reports', 'sales', 'bills',
    'licenses', 'branches', 'marketing', 'activityLog', 'users', 'settings',
    'workingHours',
  ],
};

export function getPermissionsForBusinessType(bt: BusinessType | string | undefined | null): Permission[] {
  const key = (bt as BusinessType) || 'restaurant';
  return BUSINESS_TYPE_PERMISSIONS[key] || BUSINESS_TYPE_PERMISSIONS.restaurant;
}

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

// Check if user has permission to view a feature (backwards compatible)
export function hasPermission(userPermissions: PermissionSet | undefined, userRole: string, permission: Permission): boolean {
  if (userRole === 'admin') return true;
  if (!userPermissions) return false;
  const value = userPermissions[permission];
  // Legacy boolean check
  if (value === true) return true;
  if (value === false || value === undefined) return false;
  // Granular permission - check if view is allowed
  return value.view === true;
}

// Check if user can perform a specific action on a feature
export function canPerformAction(
  userPermissions: PermissionSet | undefined, 
  userRole: string, 
  permission: Permission, 
  action: PermissionAction
): boolean {
  if (userRole === 'admin') return true;
  if (!userPermissions) return false;
  const value = userPermissions[permission];
  return hasPermissionAction(value, action);
}

export function hasAnyPermission(userPermissions: PermissionSet | undefined, userRole: string, ...permissions: Permission[]): boolean {
  if (userRole === 'admin') return true;
  if (!userPermissions) return false;
  return permissions.some(p => hasPermission(userPermissions, 'employee', p));
}

export function hasAllPermissions(userPermissions: PermissionSet | undefined, userRole: string, ...permissions: Permission[]): boolean {
  if (userRole === 'admin') return true;
  if (!userPermissions) return false;
  return permissions.every(p => hasPermission(userPermissions, 'employee', p));
}
