import type { RequestHandler } from 'express';

// Wraps async route handlers so rejected promises hit the error middleware.
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
