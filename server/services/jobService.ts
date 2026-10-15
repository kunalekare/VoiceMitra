import { db } from '../config/database';
import { sseManager } from '../utils/sse';
import { logAuditEvent } from '../middleware/logger';

export interface JobRow {
  id: string;
  employer_id: string;
  worker_id: string;
  skill_required: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  daily_wage_paise: number;
  platform_fee_paise: number;
  total_amount_paise: number;
  payment_status: string;
  payment_id?: string;
  order_id?: string;
  payout_id?: string;
  employer_review_score?: number;
  worker_review_score?: number;
  is_group_job: number;
  worker_count: number;
  created_at: string;
}

export interface JobDto {
  id: string;
  employerId: string;
  workerId: string;
  workerIds: string[];
  skillRequired: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  dailyWageInr: number;
  platformFeeInr: number;
  totalAmountInr: number;
  paymentStatus: string;
  paymentId?: string;
  orderId?: string;
  employerReviewScore?: number;
  workerReviewScore?: number;
  isGroupJob: boolean;
  workerCount: number;
  createdAt: string;
}

export function formatJobRow(row: JobRow, workerIds: string[] = []): JobDto {
  return {
    id: row.id,
    employerId: row.employer_id,
    workerId: row.worker_id,
    workerIds: workerIds.length > 0 ? workerIds : [row.worker_id],
    skillRequired: row.skill_required,
    description: row.description,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    durationDays: row.duration_days,
    dailyWageInr: Math.round(row.daily_wage_paise / 100),
    platformFeeInr: Math.round(row.platform_fee_paise / 100),
    totalAmountInr: Math.round(row.total_amount_paise / 100),
    paymentStatus: row.payment_status,
    paymentId: row.payment_id || undefined,
    orderId: row.order_id || undefined,
    employerReviewScore: row.employer_review_score || undefined,
    workerReviewScore: row.worker_review_score || undefined,
    isGroupJob: row.is_group_job === 1,
    workerCount: row.worker_count || 1,
    createdAt: row.created_at
  };
}

export function createJobBooking(params: {
  employerId: string;
  workerIds: string[];
  skillRequired: string;
  description: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  dailyWageInr: number;
  employerPlan?: string;
}): JobDto {
  const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const workerCount = params.workerIds.length;
  const isGroupJob = workerCount > 1;
  const primaryWorkerId = params.workerIds[0] || 'w-unassigned';

  // Platform fee based on employer plan
  let platformFeeInr = 99;
  if (params.employerPlan === 'contractor_monthly') platformFeeInr = 199;
  if (params.employerPlan === 'enterprise') platformFeeInr = 299;

  const dailyWagePaise = params.dailyWageInr * 100;
  const platformFeePaise = platformFeeInr * 100;
  const totalAmountPaise = dailyWagePaise * params.durationDays * workerCount + platformFeePaise;

  db.transaction(() => {
    db.run(`
      INSERT INTO jobs (
        id, employer_id, worker_id, skill_required, description,
        status, start_date, end_date, duration_days,
        daily_wage_paise, platform_fee_paise, total_amount_paise,
        payment_status, is_group_job, worker_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?, 'pending', ?, ?, datetime('now'), datetime('now'));
    `, [
      jobId,
      params.employerId,
      primaryWorkerId,
      params.skillRequired,
      params.description,
      params.startDate,
      params.endDate,
      params.durationDays,
      dailyWagePaise,
      platformFeePaise,
      totalAmountPaise,
      isGroupJob ? 1 : 0,
      workerCount
    ]);

    for (const wId of params.workerIds) {
      db.run(`
        INSERT INTO job_workers (id, job_id, worker_id, worker_status, payout_status, allocated_amount_paise, created_at)
        VALUES (?, ?, ?, 'offered', 'pending', ?, datetime('now'));
      `, [
        `jw-${jobId}-${wId}`,
        jobId,
        wId,
        dailyWagePaise * params.durationDays
      ]);
    }
  });

  const row = db.queryOne<JobRow>('SELECT * FROM jobs WHERE id = ?;', [jobId])!;
  const job = formatJobRow(row, params.workerIds);

  logAuditEvent(params.employerId, 'employer', 'JOB_CREATED', 'job', jobId, undefined, {
    totalAmountInr: job.totalAmountInr,
    workerCount
  });

  return job;
}

export function transitionJobStatus(jobId: string, newStatus: string, actorId: string, actorRole: string): JobDto {
  const job = db.queryOne<JobRow>('SELECT * FROM jobs WHERE id = ?;', [jobId]);
  if (!job) {
    throw new Error('Job not found');
  }

  // Validate State Machine
  const validTransitions: Record<string, string[]> = {
    pending_payment: ['funded', 'cancelled'],
    funded: ['accepted', 'cancelled', 'disputed'],
    accepted: ['in_progress', 'cancelled', 'disputed'],
    in_progress: ['completed', 'disputed'],
    completed: ['escrow_released', 'disputed'],
    disputed: ['in_progress', 'completed', 'cancelled', 'refunded'],
    cancelled: []
  };

  const allowed = validTransitions[job.status] || [];
  if (!allowed.includes(newStatus) && newStatus !== job.status) {
    throw new Error(`Invalid status transition from '${job.status}' to '${newStatus}'. Allowed: ${allowed.join(', ')}`);
  }

  db.transaction(() => {
    // If completing job and releasing escrow to worker wallet
    if (newStatus === 'escrow_released' || (newStatus === 'completed' && job.payment_status === 'escrow_locked')) {
      const wagePortionPaise = job.total_amount_paise - job.platform_fee_paise;

      // Credit worker wallet balance
      db.run('UPDATE workers SET wallet_balance_paise = wallet_balance_paise + ?, total_jobs = total_jobs + 1 WHERE id = ?;', [
        wagePortionPaise,
        job.worker_id
      ]);

      // Record Escrow release in ledger
      db.run(`
        INSERT INTO escrow_ledger (id, job_id, payer_id, beneficiary_id, amount_paise, type, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'release_to_worker', 'settled', datetime('now'));
      `, [
        `esc-${Date.now()}-rel`,
        job.id,
        job.employer_id,
        job.worker_id,
        wagePortionPaise
      ]);

      // Record platform fee in ledger
      db.run(`
        INSERT INTO escrow_ledger (id, job_id, payer_id, beneficiary_id, amount_paise, type, status, created_at)
        VALUES (?, ?, ?, 'skillbridge_platform', ?, 'platform_fee', 'settled', datetime('now'));
      `, [
        `esc-${Date.now()}-fee`,
        job.id,
        job.employer_id,
        job.platform_fee_paise
      ]);

      db.run(`
        UPDATE jobs
        SET status = 'completed', payment_status = 'escrow_released', updated_at = datetime('now')
        WHERE id = ?;
      `, [jobId]);

      // Send in-app notification to worker
      db.run(`
        INSERT INTO notifications (id, user_id, title, message, channel, created_at)
        VALUES (?, ?, 'Wage Payment Credited!', ?, 'in_app', datetime('now'));
      `, [
        `notif-${Date.now()}`,
        job.worker_id,
        `₹${Math.round(wagePortionPaise / 100)} has been released to your SkillBridge wallet for job ${job.id}`
      ]);
    } else {
      let paymentStatus = job.payment_status;
      if (newStatus === 'funded') {
        paymentStatus = 'escrow_locked';
      }

      db.run(`
        UPDATE jobs
        SET status = ?, payment_status = ?, updated_at = datetime('now')
        WHERE id = ?;
      `, [newStatus, paymentStatus, jobId]);
    }
  });

  const updatedRow = db.queryOne<JobRow>('SELECT * FROM jobs WHERE id = ?;', [jobId])!;
  const workerRows = db.query<{ worker_id: string }>('SELECT worker_id FROM job_workers WHERE job_id = ?;', [jobId]);
  const workerIds = workerRows.map(r => r.worker_id);
  const updatedJob = formatJobRow(updatedRow, workerIds);

  logAuditEvent(actorId, actorRole, `JOB_STATUS_${newStatus.toUpperCase()}`, 'job', jobId);

  // Broadcast real-time SSE
  sseManager.broadcast('job_updated', {
    jobId: updatedJob.id,
    status: updatedJob.status,
    paymentStatus: updatedJob.paymentStatus,
    employerId: updatedJob.employerId,
    workerId: updatedJob.workerId
  });

  return updatedJob;
}

export function getJobsForEmployer(employerId: string): JobDto[] {
  const rows = db.query<JobRow>('SELECT * FROM jobs WHERE employer_id = ? ORDER BY created_at DESC;', [employerId]);
  return rows.map(r => {
    const wRows = db.query<{ worker_id: string }>('SELECT worker_id FROM job_workers WHERE job_id = ?;', [r.id]);
    return formatJobRow(r, wRows.map(w => w.worker_id));
  });
}

export function getJobsForWorker(workerId: string): JobDto[] {
  const rows = db.query<JobRow>(`
    SELECT j.* FROM jobs j
    LEFT JOIN job_workers jw ON j.id = jw.job_id
    WHERE j.worker_id = ? OR jw.worker_id = ?
    ORDER BY j.created_at DESC;
  `, [workerId, workerId]);
  return rows.map(r => {
    const wRows = db.query<{ worker_id: string }>('SELECT worker_id FROM job_workers WHERE job_id = ?;', [r.id]);
    return formatJobRow(r, wRows.map(w => w.worker_id));
  });
}
