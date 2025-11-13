import { useAuth } from '@/lib/auth';
import type { Permission } from '@shared/permissions';

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.[permission] === true;
  };

  const hasAnyPermission = (...permissions: Permission[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.some(p => user.permissions?.[p] === true);
  };

  const hasAllPermissions = (...permissions: Permission[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return permissions.every(p => user.permissions?.[p] === true);
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    permissions: user?.permissions,
  };
}
