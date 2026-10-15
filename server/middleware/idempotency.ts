import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';

export function enforceIdempotency(req: Request, res: Response, next: NextFunction): void {
  const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body?.idempotencyKey;

  if (!idempotencyKey) {
    // If no key provided, allow request to proceed normally
    return next();
  }

  // Check if we have already processed this key
  const existing = db.queryOne<{ response_code: number; response_body: string }>(
    'SELECT response_code, response_body FROM idempotency_keys WHERE key = ?;',
    [idempotencyKey]
  );

  if (existing) {
    try {
      const parsedBody = JSON.parse(existing.response_body);
      res.setHeader('x-idempotent-replay', 'true');
      res.status(existing.response_code).json(parsedBody);
      return;
    } catch {
      res.status(existing.response_code).send(existing.response_body);
      return;
    }
  }

  // Intercept response to store it
  const originalJson = res.json.bind(res);
  res.json = (body: any): Response => {
    try {
      db.run(
        'INSERT OR REPLACE INTO idempotency_keys (key, endpoint, response_code, response_body, created_at) VALUES (?, ?, ?, ?, ?);',
        [idempotencyKey, req.path, res.statusCode, JSON.stringify(body), Date.now()]
      );
    } catch (err) {
      console.error('Failed to store idempotency key:', err);
    }
    return originalJson(body);
  };

  next();
}
