import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { sendError } from '../utils/response';

export interface AuthUser {
  id: string;
  phone: string;
  role: 'worker' | 'employer' | 'admin';
  name: string;
  employerType?: 'household' | 'contractor' | 'small_business' | 'enterprise';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Check authorization header first, then cookies
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    // If no token provided, but dev mock header is present for test convenience
    const devUserId = req.headers['x-dev-user-id'] as string;
    const devRole = (req.headers['x-dev-role'] as 'worker' | 'employer' | 'admin') || 'worker';
    if (devUserId) {
      req.user = {
        id: devUserId,
        phone: '+919876543210',
        role: devRole,
        name: 'Dev User'
      };
      return next();
    }

    sendError(req, res, 'UNAUTHORIZED', 'Authentication token missing or invalid', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    sendError(req, res, 'INVALID_TOKEN', 'Token expired or invalid', 401);
  }
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as AuthUser;
      req.user = decoded;
    } catch {}
  } else {
    const devUserId = req.headers['x-dev-user-id'] as string;
    if (devUserId) {
      req.user = {
        id: devUserId,
        phone: '+919876543210',
        role: (req.headers['x-dev-role'] as 'worker' | 'employer' | 'admin') || 'worker',
        name: 'Dev User'
      };
    }
  }

  next();
}

export function requireRole(allowedRoles: ('worker' | 'employer' | 'admin')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(req, res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(req, res, 'FORBIDDEN', `Role '${req.user.role}' is not authorized to access this resource`, 403);
      return;
    }

    next();
  };
}
