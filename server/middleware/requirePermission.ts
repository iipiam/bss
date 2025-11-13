import { Request, Response, NextFunction } from 'express';
import { Permission, hasAnyPermission, hasAllPermissions as checkAllPermissions } from '@shared/permissions';

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
