import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`Operational error: ${err.message}`);
  } else {
    logger.error(`Unexpected error: ${err.message}`, { stack: err.stack });
  }

  // Send response
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        statusCode: err.statusCode
      }
    });
    return;
  }

  // Unknown error - don't leak details
  res.status(500).json({
    error: {
      message: 'Internal server error',
      statusCode: 500
    }
  });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: 'Not found',
      statusCode: 404
    }
  });
}
