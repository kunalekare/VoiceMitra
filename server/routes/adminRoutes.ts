import { Router, Request, Response } from 'express';
import { db } from '../config/database';
import { evaluateLiveFraudRules } from '../services/fraudService';
import { sendSuccess, sendError } from '../utils/response';
import { logAuditEvent } from '../middleware/logger';
import { sseManager } from '../utils/sse';

export const adminRouter = Router();

// Metrics & KPIs
adminRouter.get('/metrics', (req: Request, res: Response) => {
  try {
    const totalWorkers = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM workers;')?.count || 0;
    const activeWorkers = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM workers WHERE status = "active";')?.count || 0;
    const totalEmployers = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM employers;')?.count || 0;
    const totalJobs = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM jobs;')?.count || 0;
    const completedJobs = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM jobs WHERE status = "completed";')?.count || 0;
    const disputedJobs = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM jobs WHERE status = "disputed";')?.count || 0;

    const gmvPaise = db.queryOne<{ total: number }>('SELECT SUM(total_amount_paise) as total FROM jobs WHERE payment_status IN ("paid", "escrow_locked", "escrow_released");')?.total || 0;
    const platformFeePaise = db.queryOne<{ total: number }>('SELECT SUM(platform_fee_paise) as total FROM jobs WHERE payment_status IN ("paid", "escrow_locked", "escrow_released");')?.total || 0;
    const escrowLockedPaise = db.queryOne<{ total: number }>('SELECT SUM(total_amount_paise) as total FROM jobs WHERE payment_status = "escrow_locked";')?.total || 0;

    return sendSuccess(req, res, {
      totalWorkers,
      activeWorkers,
      totalEmployers,
      totalJobs,
      completedJobs,
      disputedJobs,
      gmvInr: Math.round(gmvPaise / 100),
      platformRevenueInr: Math.round(platformFeePaise / 100),
      escrowLockedInr: Math.round(escrowLockedPaise / 100)
    });
  } catch (err: any) {
    return sendError(req, res, 'METRICS_FAILED', err.message, 500);
  }
});

// All Workers with management status
adminRouter.get('/workers', (req: Request, res: Response) => {
  try {
    const workers = db.query('SELECT * FROM workers ORDER BY reputation_score DESC LIMIT 100;');
    return sendSuccess(req, res, workers);
  } catch (err: any) {
    return sendError(req, res, 'FETCH_WORKERS_FAILED', err.message, 500);
  }
});

// Update Worker Status (suspend, activate, deactivate)
adminRouter.patch('/workers/:id/status', (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body;
    db.run('UPDATE workers SET status = ?, updated_at = datetime("now") WHERE id = ?;', [status, req.params.id]);

    logAuditEvent(req.user?.id || 'admin-01', 'admin', `WORKER_STATUS_${status.toUpperCase()}`, 'worker', req.params.id, undefined, { reason });

    return sendSuccess(req, res, { workerId: req.params.id, status });
  } catch (err: any) {
    return sendError(req, res, 'STATUS_UPDATE_FAILED', err.message, 400);
  }
});

// Live Fraud Queue (5 live computed rules + database flags)
adminRouter.get('/fraud-queue', (req: Request, res: Response) => {
  try {
    const items = evaluateLiveFraudRules();
    return sendSuccess(req, res, items);
  } catch (err: any) {
    return sendError(req, res, 'FRAUD_QUEUE_FAILED', err.message, 500);
  }
});

// Audit Logs
adminRouter.get('/audit-logs', (req: Request, res: Response) => {
  try {
    const logs = db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;');
    return sendSuccess(req, res, logs);
  } catch (err: any) {
    return sendError(req, res, 'FETCH_AUDIT_LOGS_FAILED', err.message, 500);
  }
});

// Broadcast SMS / WhatsApp Tool
adminRouter.post('/broadcast', (req: Request, res: Response) => {
  try {
    const { channel, targetSkill, targetDistrict, message } = req.body;
    if (!message) {
      return sendError(req, res, 'MISSING_MESSAGE', 'Broadcast message cannot be empty', 400);
    }

    // Count recipients
    let sql = 'SELECT COUNT(*) as count FROM workers WHERE status = "active"';
    const params: unknown[] = [];
    if (targetSkill && targetSkill !== 'all') {
      sql += ' AND primary_skill = ?';
      params.push(targetSkill);
    }
    if (targetDistrict && targetDistrict !== 'all') {
      sql += ' AND district = ?';
      params.push(targetDistrict);
    }

    const count = db.queryOne<{ count: number }>(sql, params)?.count || 0;

    logAuditEvent('admin-01', 'admin', 'BROADCAST_SENT', 'broadcast', channel || 'whatsapp', undefined, {
      channel,
      targetSkill,
      targetDistrict,
      recipientCount: count,
      messageSnippet: message.slice(0, 50)
    });

    sseManager.broadcast('admin_broadcast', {
      channel,
      message,
      sentAt: new Date().toISOString()
    });

    return sendSuccess(req, res, {
      success: true,
      deliveredCount: count,
      channel: channel || 'whatsapp',
      message: `Broadcast message sent to ${count} active workers.`
    });
  } catch (err: any) {
    return sendError(req, res, 'BROADCAST_FAILED', err.message, 500);
  }
});
