import { db } from '../config/database';

export interface FraudFlagItem {
  id: string;
  workerId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  status: 'pending_review' | 'cleared' | 'suspended';
  createdAt: string;
}

export function evaluateLiveFraudRules(): FraudFlagItem[] {
  const flags: FraudFlagItem[] = [];

  // 1. Check for Duplicate Aadhaar Hashes
  const dupes = db.query<{ aadhaar_hash: string; count: number }>(`
    SELECT aadhaar_hash, COUNT(*) as count
    FROM workers
    WHERE aadhaar_hash IS NOT NULL AND aadhaar_hash != ''
    GROUP BY aadhaar_hash
    HAVING count > 1;
  `);

  for (const d of dupes) {
    flags.push({
      id: `rule-dup-aadhaar-${d.aadhaar_hash.slice(0, 8)}`,
      workerId: 'multiple',
      reason: 'Biometric Collision: Duplicate Aadhaar Hash detected across multiple profiles',
      severity: 'critical',
      details: `${d.count} accounts share the same encrypted Aadhaar hash signature. Potential synthetic identity fraud.`,
      status: 'pending_review',
      createdAt: new Date().toISOString()
    });
  }

  // 2. High Hire Velocity / Burst check
  const velocity = db.query<{ employer_id: string; hire_count: number }>(`
    SELECT employer_id, COUNT(*) as hire_count
    FROM jobs
    WHERE created_at >= datetime('now', '-24 hours')
    GROUP BY employer_id
    HAVING hire_count >= 6;
  `);

  for (const v of velocity) {
    flags.push({
      id: `rule-vel-${v.employer_id}`,
      workerId: v.employer_id,
      reason: 'Abnormal Hire Velocity Spike',
      severity: 'high',
      details: `Employer created ${v.hire_count} jobs within 24 hours. Verification recommended.`,
      status: 'pending_review',
      createdAt: new Date().toISOString()
    });
  }

  // 3. Repeated Dispute Workers
  const disputeFreq = db.query<{ worker_id: string; disp_count: number }>(`
    SELECT j.worker_id, COUNT(d.id) as disp_count
    FROM disputes d
    JOIN jobs j ON d.job_id = j.id
    GROUP BY j.worker_id
    HAVING disp_count >= 2;
  `);

  for (const df of disputeFreq) {
    flags.push({
      id: `rule-disp-${df.worker_id}`,
      workerId: df.worker_id,
      reason: 'Elevated Dispute Rate',
      severity: 'medium',
      details: `Worker has accumulated ${df.disp_count} disputes across recent bookings.`,
      status: 'pending_review',
      createdAt: new Date().toISOString()
    });
  }

  // 4. Also fetch manually recorded fraud items
  const recorded = db.query<{
    id: string;
    worker_id: string;
    reason: string;
    severity: string;
    details: string;
    status: string;
    created_at: string;
  }>('SELECT * FROM fraud_flags ORDER BY created_at DESC LIMIT 20;');

  for (const r of recorded) {
    flags.push({
      id: r.id,
      workerId: r.worker_id,
      reason: r.reason,
      severity: r.severity as any,
      details: r.details,
      status: r.status as any,
      createdAt: r.created_at
    });
  }

  return flags;
}
