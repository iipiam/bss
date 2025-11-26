import { useAuth } from '@/lib/auth';
import type { Permission, PermissionAction, PermissionValue, GranularPermission } from '@shared/permissions';
import { normalizePermission, hasPermissionAction } from '@shared/permissions';

export function usePermissions() {
  const { user } = useAuth();

  // Check if user has view access to a feature (backwards compatible)
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const value = user.permissions?.[permission];
    // Legacy boolean check
    if (value === true) return true;
    if (value === false || value === undefined) return false;
    // Granular permission - check if view is allowed
    return (value as GranularPermission).view === true;
  };

  // Check if user can perform a specific action on a feature
  const canPerformAction = (permission: Permission, action: PermissionAction): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const value = user.permissions?.[permission];
    return hasPermissionAction(value, action);
  };

  // Shorthand helpers for common actions
  const canView = (permission: Permission): boolean => canPerformAction(permission, 'view');
  const canAdd = (permission: Permission): boolean => canPerformAction(permission, 'add');
  const canEdit = (permission: Permission): boolean => canPerformAction(permission, 'edit');
  const canDelete = (permission: Permission): boolean => canPerformAction(permission, 'delete');

  const hasAnyPermission = (...permissions: Permission[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (...permissions: Permission[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.every(p => hasPermission(p));
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  return {
    hasPermission,
    canPerformAction,
    canView,
    canAdd,
    canEdit,
    canDelete,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    permissions: user?.permissions,
  };
}
