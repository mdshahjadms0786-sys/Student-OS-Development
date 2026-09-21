import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: string[];

  constructor(message: string, statusCode = 500, errors?: string[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const errorMessages = err.errors.map(
      (e) => `${e.path.join('.') || 'body'}: ${e.message}`
    );
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  const error = err as Error;
  const isProd = process.env['NODE_ENV'] === 'production';

  console.error(`[Unhandled Exception] ${req.method} ${req.originalUrl}:`, error);

  res.status(500).json({
    success: false,
    message: isProd ? 'Internal Server Error' : error.message || 'An unexpected error occurred',
  });
}
