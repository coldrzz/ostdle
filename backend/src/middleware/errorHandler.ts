import type { Request, Response, NextFunction } from 'express';
import type { ApiError } from '../types/index.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public error = 'Error',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: ApiError = {
      error: err.error,
      message: err.message,
      statusCode: err.statusCode,
    };
    res.status(err.statusCode).json(body);
    return;
  }

  console.error('[Unhandled Error]', err);
  const body: ApiError = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    statusCode: 500,
  };
  res.status(500).json(body);
}

export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: T, res: Response, next: NextFunction): void => {
    void fn(req, res, next).catch(next);
  };
}

export function devOnly(_req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV !== 'development') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin panel is only available in development mode',
      statusCode: 403,
    });
    return;
  }
  next();
}
