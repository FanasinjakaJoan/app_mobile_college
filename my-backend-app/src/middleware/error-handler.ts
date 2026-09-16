import { NextFunction, Request, Response } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('http');

/** Terminal handler for unknown routes — always answers JSON. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
}

interface HttpError extends Error {
  status?: number;
  type?: string;
}

/**
 * Central error handler: normalises every failure into a JSON envelope and
 * never leaks internal details (stack traces, driver errors, …) to clients.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // Malformed JSON body rejected by express.json().
  const httpErr = err as HttpError;
  if (httpErr?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { message: 'Request body is not valid JSON.' } });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unexpected error';
  logger.error('Unhandled error', {
    method: req.method,
    url: req.originalUrl,
    error: message,
  });

  const status = typeof httpErr?.status === 'number' && httpErr.status >= 400 && httpErr.status < 600 ? httpErr.status : 500;
  res.status(status).json({ error: { message: 'Internal server error.' } });
}
