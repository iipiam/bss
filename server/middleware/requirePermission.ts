import { Request, Response, NextFunction } from 'express';
import { Permission, PermissionAction, hasAnyPermission, hasAllPermissions as checkAllPermissions, canPerformAction } from '@shared/permissions';

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.session.user;

    if (!hasAnyPermission(user.permissions, user.role, ...permissions)) {
      console.log(`[AUTH] Permission denied for user ${user.id}: required ${permissions.join(' OR ')}`);
      return res.status(403).json({ 
        error: 'Permission denied',
        required: permissions,
      });
    }

    next();
  };
}

// Require permission with specific action (view, add, edit, delete)
export function requireAction(permission: Permission, action: PermissionAction) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.session.user;

    if (!canPerformAction(user.permissions, user.role, permission, action)) {
      console.log(`[AUTH] Action denied for user ${user.id}: required ${action} on ${permission}`);
      return res.status(403).json({ 
        error: `Permission denied - cannot ${action}`,
        required: { permission, action },
      });
    }

    next();
  };
}

export function requireAnyPermission(...permissions: Permission[]) {
  return requirePermission(...permissions);
}

export function requireAllPermissions(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = req.session.user;

    if (!checkAllPermissions(user.permissions, user.role, ...permissions)) {
      console.log(`[AUTH] Permission denied for user ${user.id}: required ALL of ${permissions.join(' AND ')}`);
      return res.status(403).json({ 
        error: 'Permission denied - requires all permissions',
        required: permissions,
      });
    }

    next();
  };
}
