import crypto from 'crypto';
import { db } from '../config/database';
import { ENV } from '../config/env';
import { logAuditEvent } from '../middleware/logger';
import { sseManager } from '../utils/sse';
import { JobRow } from './jobService';

export interface PaymentOrderResult {
  orderId: string;
  amountPaise: number;
  currency: string;
  jobId: string;
  keyId: string;
}

export function createPaymentOrder(jobId: string, employerId: string): PaymentOrderResult {
  const job = db.queryOne<JobRow>('SELECT * FROM jobs WHERE id = ?;', [jobId]);
  if (!job) {
    throw new Error('Job not found');
  }

  const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const keyId = ENV.RAZORPAY_KEY_ID || 'rzp_test_skillbridge_demo_key';

  db.run('UPDATE jobs SET order_id = ? WHERE id = ?;', [orderId, jobId]);

  return {
    orderId,
    amountPaise: job.total_amount_paise,
    currency: 'INR',
    jobId,
    keyId
  };
}

export function verifyPaymentAndFundJob(params: {
  jobId: string;
  employerId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  idempotencyKey?: string;
}): { success: boolean; paymentId: string; jobId: string } {
  const job = db.queryOne<JobRow>('SELECT * FROM jobs WHERE id = ?;', [params.jobId]);
  if (!job) {
    throw new Error('Job not found');
  }

  // Verify signature if secret configured
  if (ENV.RAZORPAY_KEY_SECRET && params.razorpaySignature) {
    const generated = crypto
      .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
      .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
      .digest('hex');

    if (generated !== params.razorpaySignature) {
      throw new Error('Invalid Razorpay payment signature');
    }
  }

  const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  db.transaction(() => {
    // Record payment
    db.run(`
      INSERT INTO payments (
        id, job_id, employer_id, amount_paise, currency, payment_method,
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        status, idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, 'INR', 'upi', ?, ?, ?, 'captured', ?, datetime('now'));
    `, [
      paymentId,
      params.jobId,
      params.employerId,
      job.total_amount_paise,
      params.razorpayOrderId,
      params.razorpayPaymentId,
      params.razorpaySignature || 'simulated_sig',
      params.idempotencyKey || null
    ]);

    // Record Escrow deposit & lock in ledger
    db.run(`
      INSERT INTO escrow_ledger (id, job_id, payer_id, beneficiary_id, amount_paise, type, status, reference_id, created_at)
      VALUES (?, ?, ?, ?, ?, 'lock', 'settled', ?, datetime('now'));
    `, [
      `esc-${Date.now()}-lock`,
      params.jobId,
      params.employerId,
      job.worker_id,
      job.total_amount_paise,
      paymentId
    ]);

    // Update Job status to 'funded' / payment_status 'escrow_locked'
    db.run(`
      UPDATE jobs
      SET status = 'funded', payment_status = 'escrow_locked', payment_id = ?, updated_at = datetime('now')
      WHERE id = ?;
    `, [paymentId, params.jobId]);

    // Send notifications to worker and employer
    db.run(`
      INSERT INTO notifications (id, user_id, title, message, channel, created_at)
      VALUES (?, ?, 'New Job Offer Received!', ?, 'in_app', datetime('now'));
    `, [
      `notif-${Date.now()}-1`,
      job.worker_id,
      `An employer has funded a new job (₹${Math.round(job.total_amount_paise / 100)}) for your trade. Tap to view and accept!`
    ]);
  });

  logAuditEvent(params.employerId, 'employer', 'PAYMENT_CAPTURED_ESCROW_LOCKED', 'payment', paymentId, undefined, {
    jobId: params.jobId,
    amountInr: job.total_amount_paise / 100
  });

  // Broadcast real-time SSE
  sseManager.broadcast('payment_success', {
    jobId: params.jobId,
    paymentId,
    employerId: params.employerId,
    workerId: job.worker_id,
    amountInr: job.total_amount_paise / 100
  });

  return { success: true, paymentId, jobId: params.jobId };
}

export function disburseWorkerPayout(params: {
  workerId: string;
  amountPaise: number;
  mode: 'upi' | 'bank_account';
  destination: string;
  ifsc?: string;
  accountHolderName?: string;
}): { payoutId: string; utrNumber: string; amountInr: number; status: string } {
  const worker = db.queryOne<{ id: string; wallet_balance_paise: number; name: string }>(
    'SELECT id, wallet_balance_paise, name FROM workers WHERE id = ?;',
    [params.workerId]
  );

  if (!worker) {
    throw new Error('Worker not found');
  }

  if (worker.wallet_balance_paise < params.amountPaise) {
    throw new Error(`Insufficient wallet balance. Available: ₹${Math.round(worker.wallet_balance_paise / 100)}, Requested: ₹${Math.round(params.amountPaise / 100)}`);
  }

  const payoutId = `pout-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const utrNumber = `UTR-RZPX-${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

  db.transaction(() => {
    // Deduct worker wallet balance
    db.run('UPDATE workers SET wallet_balance_paise = wallet_balance_paise - ? WHERE id = ?;', [
      params.amountPaise,
      params.workerId
    ]);

    // Record Payout in payouts table
    db.run(`
      INSERT INTO payouts (id, worker_id, amount_paise, mode, destination, ifsc, utr_number, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'processed', datetime('now'));
    `, [
      payoutId,
      params.workerId,
      params.amountPaise,
      params.mode,
      params.destination,
      params.ifsc || null,
      utrNumber
    ]);

    // Notification
    db.run(`
      INSERT INTO notifications (id, user_id, title, message, channel, created_at)
      VALUES (?, ?, 'Instant Wage Payout Processed', ?, 'in_app', datetime('now'));
    `, [
      `notif-${Date.now()}`,
      params.workerId,
      `₹${Math.round(params.amountPaise / 100)} disbursed to ${params.destination} via RazorpayX (UTR: ${utrNumber})`
    ]);
  });

  logAuditEvent(params.workerId, 'worker', 'PAYOUT_DISBURSED', 'payout', payoutId, undefined, {
    amountInr: params.amountPaise / 100,
    utrNumber,
    destination: params.destination
  });

  sseManager.sendToUser(params.workerId, 'payout_completed', {
    payoutId,
    utrNumber,
    amountInr: params.amountPaise / 100
  });

  return {
    payoutId,
    utrNumber,
    amountInr: Math.round(params.amountPaise / 100),
    status: 'processed'
  };
}

export function getPayoutsForWorker(workerId: string): unknown[] {
  return db.query('SELECT * FROM payouts WHERE worker_id = ? ORDER BY created_at DESC;', [workerId]);
}
