import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('No authorization header', 401);
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new AppError('Invalid authorization format', 401);
  }

  const token = authHeader.slice(7);

  try {
    // Simplified for demo - use proper JWT verification in production
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch {
    throw new AppError('Invalid token', 401);
  }
}

function verifyToken(token: string): { userId: string } {
  // Simplified for demo - use jsonwebtoken in production
  if (token.startsWith('valid_')) {
    return { userId: token.slice(6) };
  }
  throw new Error('Invalid token');
}

export function generateToken(userId: string): string {
  // Simplified for demo
  return `valid_${userId}`;
}
