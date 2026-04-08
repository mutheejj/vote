import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import logger from '../utils/logger';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err } as any;
  error.message = err.message;
  let shouldLog = true; // Flag to prevent duplicate logging

  // Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        const field = (err.meta?.target as string[])?.[0];
        error = new AppError(
          `${field ? field + ' already exists' : 'Duplicate field value'}`,
          409
        );
        break;
      case 'P2025':
        // Record not found
        error = new AppError('Record not found', 404);
        break;
      case 'P2003':
        // Foreign key constraint violation
        error = new AppError('Related record not found', 400);
        break;
      default:
        error = new AppError('Database operation failed', 500);
    }
  }

  // JWT errors - these are common and don't need stack traces
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
    logger.warn(`Auth error: Invalid token | ${req.method} ${req.originalUrl} | ip=${req.ip}`);
    shouldLog = false; // Already logged above
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token has expired', 401);
    logger.info(`Auth error: Token expired | ${req.method} ${req.originalUrl} | ip=${req.ip}`);
    shouldLog = false; // Already logged above
  }

  // Validation errors from express-validator
  if (err.name === 'ValidationError') {
    const errors = Object.values((err as any).errors).map((e: any) => e.message);
    error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors);
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    switch ((err as any).code) {
      case 'LIMIT_FILE_SIZE':
        error = new AppError('File too large', 400);
        break;
      case 'LIMIT_FILE_COUNT':
        error = new AppError('Too many files', 400);
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        error = new AppError('Unexpected field', 400);
        break;
      default:
        error = new AppError('File upload failed', 400);
    }
  }

  // Log error with context (if not already logged)
  if (shouldLog) {
    const isOperationalError = err instanceof AppError;
    const statusCode = error.statusCode || 500;

    // Only log full stack traces for server errors (5xx) or unknown errors
    if (statusCode >= 500 || !isOperationalError) {
      logger.error(`${error.message || err.message} | ${req.method} ${req.originalUrl} | status=${statusCode} ip=${req.ip} user=${(req as any).user?.id || 'none'}`, {
        stack: err.stack,
        statusCode
      });
    } else {
      // For client errors (4xx), log without stack trace for cleaner logs
      logger.warn(`${error.message || err.message} | ${req.method} ${req.originalUrl} | status=${statusCode} ip=${req.ip} user=${(req as any).user?.id || 'none'}`);
    }
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      statusCode: error.statusCode || 500,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: error.details
      })
    }
  });
};

/**
 * Not found error handler
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route not found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};