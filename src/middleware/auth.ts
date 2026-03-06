import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser } from '../types/express.d';

function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
    if (err) {
      let errorCode = 'INVALID_TOKEN';
      let errorMessage = 'Invalid or expired token';

      if (err.name === 'TokenExpiredError') {
        errorCode = 'TOKEN_EXPIRED';
        errorMessage = 'Token has expired';
      } else if (err.name === 'JsonWebTokenError') {
        errorCode = 'TOKEN_MALFORMED';
        errorMessage = 'Token is malformed';
      }

      res.status(403).json({
        error: errorMessage,
        code: errorCode
      });
      return;
    }

    req.user = user as AuthenticatedUser;
    next();
  });
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.userType !== 'super_admin') {
    res.status(403).json({
      error: 'Super admin access required',
      code: 'SUPER_ADMIN_REQUIRED'
    });
    return;
  }
  next();
}

function requireClient(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.userType !== 'client') {
    res.status(403).json({
      error: 'Client access required',
      code: 'CLIENT_REQUIRED'
    });
    return;
  }
  next();
}

function requireClientOrStaff(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || (req.user.userType !== 'client' && req.user.userType !== 'staff')) {
    res.status(403).json({
      error: 'Client or staff access required',
      code: 'CLIENT_OR_STAFF_REQUIRED'
    });
    return;
  }
  next();
}

export {
  authenticateToken,
  requireSuperAdmin,
  requireClient,
  requireClientOrStaff
};
