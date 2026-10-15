import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms - ${requestId}`);
    }
  });

  next();
}

export function logAuditEvent(
  actorId: string,
  actorRole: string,
  action: string,
  entityType: string,
  entityId: string,
  ipAddress?: string,
  details?: Record<string, unknown>
): void {
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.run(`
      INSERT INTO audit_logs (id, actor_id, actor_role, action, entity_type, entity_id, ip_address, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));
    `, [
      id,
      actorId || 'system',
      actorRole || 'system',
      action,
      entityType,
      entityId,
      ipAddress || '127.0.0.1',
      details ? JSON.stringify(details) : null
    ]);
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
