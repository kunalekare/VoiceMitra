import { db } from '../config/database';
import { logAuditEvent } from '../middleware/logger';
import { sseManager } from '../utils/sse';
import { JobRow } from './jobService';

export interface DisputeRow {
  id: string;
  job_id: string;
  raised_by: string;
  reason: string;
  evidence?: string;
  status: string;
  resolution_notes?: string;
  resolved_by?: string;
  created_at: string;
}

export function openDispute(params: {
  jobId: string;
  raisedBy: 'employer' | 'worker';
  reason: string;
  evidence?: string;
  actorId: string;
}): DisputeRow {
  const job = db.queryOne<JobRow>('SELECT * FROM jobs WHERE id = ?;', [params.jobId]);
  if (!job) {
    throw new Error('Job not found');
  }

  const disputeId = `disp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  db.transaction(() => {
    db.run(`
      INSERT INTO disputes (id, job_id, raised_by, reason, evidence, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'open', datetime('now'));
    `, [disputeId, params.jobId, params.raisedBy, params.reason, params.evidence || '']);

    db.run(`
      UPDATE jobs
      SET status = 'disputed', updated_at = datetime('now')
      WHERE id = ?;
    `, [params.jobId]);
  });

  const dispute = db.queryOne<DisputeRow>('SELECT * FROM disputes WHERE id = ?;', [disputeId])!;

  logAuditEvent(params.actorId, params.raisedBy, 'DISPUTE_RAISED', 'dispute', disputeId, undefined, {
    jobId: params.jobId,
    reason: params.reason
  });

  sseManager.broadcast('dispute_opened', {
    disputeId,
    jobId: params.jobId,
    raisedBy: params.raisedBy
  });

  return dispute;
}

export function resolveDispute(params: {
  disputeId: string;
  resolution: 'resolve_refund' | 'resolve_disburse' | 'dismissed';
  notes: string;
  adminId: string;
}): DisputeRow {
  const dispute = db.queryOne<DisputeRow>('SELECT * FROM disputes WHERE id = ?;', [params.disputeId]);
  if (!dispute) {
    throw new Error('Dispute not found');
  }

  const job = db.queryOne<JobRow>('SELECT * FROM jobs WHERE id = ?;', [dispute.job_id]);
  if (!job) {
    throw new Error('Associated job not found');
  }

  db.transaction(() => {
    if (params.resolution === 'resolve_refund') {
      // Refund escrow to employer
      db.run(`
        INSERT INTO escrow_ledger (id, job_id, payer_id, beneficiary_id, amount_paise, type, status, created_at)
        VALUES (?, ?, 'skillbridge_escrow', ?, ?, 'refund_to_employer', 'settled', datetime('now'));
      `, [
        `esc-ref-${Date.now()}`,
        job.id,
        job.employer_id,
        job.total_amount_paise
      ]);

      db.run(`
        UPDATE jobs
        SET status = 'cancelled', payment_status = 'refunded', updated_at = datetime('now')
        WHERE id = ?;
      `, [job.id]);
    } else if (params.resolution === 'resolve_disburse') {
      // Release escrow to worker wallet
      const wagePortionPaise = job.total_amount_paise - job.platform_fee_paise;
      db.run('UPDATE workers SET wallet_balance_paise = wallet_balance_paise + ? WHERE id = ?;', [
        wagePortionPaise,
        job.worker_id
      ]);

      db.run(`
        INSERT INTO escrow_ledger (id, job_id, payer_id, beneficiary_id, amount_paise, type, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'release_to_worker', 'settled', datetime('now'));
      `, [
        `esc-rel-${Date.now()}`,
        job.id,
        job.employer_id,
        job.worker_id,
        wagePortionPaise
      ]);

      db.run(`
        UPDATE jobs
        SET status = 'completed', payment_status = 'escrow_released', updated_at = datetime('now')
        WHERE id = ?;
      `, [job.id]);
    }

    db.run(`
      UPDATE disputes
      SET status = ?, resolution_notes = ?, resolved_by = ?, resolved_at = datetime('now')
      WHERE id = ?;
    `, [params.resolution, params.notes, params.adminId, params.disputeId]);
  });

  const updated = db.queryOne<DisputeRow>('SELECT * FROM disputes WHERE id = ?;', [params.disputeId])!;

  logAuditEvent(params.adminId, 'admin', `DISPUTE_${params.resolution.toUpperCase()}`, 'dispute', params.disputeId, undefined, {
    notes: params.notes,
    jobId: job.id
  });

  sseManager.broadcast('dispute_resolved', {
    disputeId: params.disputeId,
    jobId: job.id,
    resolution: params.resolution
  });

  return updated;
}

export function getAllDisputes(): DisputeRow[] {
  return db.query<DisputeRow>('SELECT * FROM disputes ORDER BY created_at DESC;');
}
