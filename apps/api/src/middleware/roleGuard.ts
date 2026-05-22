import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware factory that restricts endpoint access to specific user roles.
 * @param allowedRoles Array of allowed roles
 */
export function requireRole(allowedRoles: ('buyer' | 'organizer' | 'admin')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User session required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Resource restricted. Required: [${allowedRoles.join(', ')}]. Found: ${req.user.role}`
      });
    }

    next();
  };
}
export const isBuyer = requireRole(['buyer']);
export const isOrganizer = requireRole(['organizer']);
export const isAdmin = requireRole(['admin']);
export const isStaffOrAdmin = requireRole(['organizer', 'admin']);

