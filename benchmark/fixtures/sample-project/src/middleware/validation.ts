import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new AppError(`Validation error: ${message}`, 400);
      }
      throw error;
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as Record<string, string>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new AppError(`Query validation error: ${message}`, 400);
      }
      throw error;
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as Record<string, string>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new AppError(`Param validation error: ${message}`, 400);
      }
      throw error;
    }
  };
}
