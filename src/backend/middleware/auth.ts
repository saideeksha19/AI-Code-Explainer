import { Request, Response, NextFunction } from 'express';
import jsonwebtoken from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function protect(req: AuthRequest, res: Response, next: NextFunction) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jsonwebtoken.verify(
        token,
        JWT_SECRET
      ) as { id: string; email: string; role?: string };

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'developer',
      };

      return next();
    } catch (error: any) {
      if (error && error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'TokenExpiredError', message: 'jwt expired' });
      }
      if (error && error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'JsonWebTokenError', message: 'invalid token' });
      }
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  // If no token, return standard warning or error
  return res.status(401).json({ error: 'Not authorized, no token provided' });
}

export function admin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Admin access required.' });
}
