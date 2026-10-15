import { db, getDatabase } from '../config/database';
import { SEED_WORKERS, SEED_EMPLOYERS, SEED_JOBS, SEED_REVIEWS, SEED_DISPUTES, SEED_AUDIT_LOGS, SEED_NOTIFICATIONS, SEED_FRAUD_QUEUE } from '../../src/data/seedData';
import bcrypt from 'bcryptjs';

export async function runMigrations(): Promise<void> {
  await getDatabase();

  db.transaction(() => {
    // 1. Users table (authentication & identity)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('worker', 'employer', 'admin')),
        employer_type TEXT CHECK(employer_type IN ('household', 'contractor', 'small_business', 'enterprise')),
        language TEXT NOT NULL DEFAULT 'hi',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 2. OTP Sessions (hashed otp, attempts, lockout, cooldown)
    db.run(`
      CREATE TABLE IF NOT EXISTS otp_sessions (
        phone TEXT PRIMARY KEY,
        hashed_otp TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        expires_at INTEGER NOT NULL,
        resend_after INTEGER NOT NULL,
        locked_until INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
    `);

    // 3. Workers table (full profile details, biometrics hash, score)
    db.run(`
      CREATE TABLE IF NOT EXISTS workers (
        id TEXT PRIMARY KEY,
        phone TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        primary_skill TEXT NOT NULL,
        secondary_skills TEXT NOT NULL DEFAULT '[]',
        experience_years INTEGER NOT NULL DEFAULT 0,
        languages_spoken TEXT NOT NULL DEFAULT '["hi"]',
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        pincode TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        voice_profile_url TEXT,
        voice_transcript TEXT,
        profile_pic_url TEXT,
        aadhaar_verified INTEGER NOT NULL DEFAULT 0,
        aadhaar_hash TEXT,
        aadhaar_masked TEXT,
        reputation_score REAL NOT NULL DEFAULT 4.5,
        total_jobs INTEGER NOT NULL DEFAULT 0,
        is_available INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'pending_kyc', 'deactivated')),
        verified_skill_badges TEXT NOT NULL DEFAULT '[]',
        portfolio_video_url TEXT,
        wallet_balance_paise INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 4. Employers table
    db.run(`
      CREATE TABLE IF NOT EXISTS employers (
        id TEXT PRIMARY KEY,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        name TEXT NOT NULL,
        business_name TEXT,
        employer_type TEXT NOT NULL DEFAULT 'household',
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free', 'contractor_monthly', 'enterprise')),
        plan_expires_at TEXT,
        total_hires INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 5. Jobs table (with strict state machine)
    db.run(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        employer_id TEXT NOT NULL,
        worker_id TEXT,
        skill_required TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_payment' CHECK(status IN ('pending_payment', 'funded', 'matched', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed')),
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        duration_days INTEGER NOT NULL DEFAULT 1,
        daily_wage_paise INTEGER NOT NULL,
        platform_fee_paise INTEGER NOT NULL,
        total_amount_paise INTEGER NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded', 'escrow_locked', 'escrow_released')),
        payment_id TEXT,
        order_id TEXT,
        payout_id TEXT,
        employer_review_score REAL,
        worker_review_score REAL,
        is_group_job INTEGER NOT NULL DEFAULT 0,
        worker_count INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (employer_id) REFERENCES employers(id)
      );
    `);

    // 6. Job Workers (for single & group hiring mappings)
    db.run(`
      CREATE TABLE IF NOT EXISTS job_workers (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        worker_id TEXT NOT NULL,
        worker_status TEXT NOT NULL DEFAULT 'offered' CHECK(worker_status IN ('offered', 'accepted', 'declined', 'in_progress', 'completed', 'disputed')),
        payout_status TEXT NOT NULL DEFAULT 'pending' CHECK(payout_status IN ('pending', 'processing', 'disbursed', 'refunded')),
        allocated_amount_paise INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (job_id) REFERENCES jobs(id),
        FOREIGN KEY (worker_id) REFERENCES workers(id)
      );
    `);

    // 7. Payments table (audit trail of transactions)
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        employer_id TEXT NOT NULL,
        amount_paise INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        payment_method TEXT NOT NULL DEFAULT 'upi',
        razorpay_order_id TEXT,
        razorpay_payment_id TEXT,
        razorpay_signature TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
        idempotency_key TEXT UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 8. Escrow Ledger (source of truth for paise funds, double-entry bookkeeping)
    db.run(`
      CREATE TABLE IF NOT EXISTS escrow_ledger (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        payer_id TEXT NOT NULL,
        beneficiary_id TEXT,
        amount_paise INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('deposit', 'lock', 'release_to_worker', 'platform_fee', 'refund_to_employer')),
        status TEXT NOT NULL DEFAULT 'settled',
        reference_id TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 9. Payouts (RazorpayX disbursals to worker bank/UPI)
    db.run(`
      CREATE TABLE IF NOT EXISTS payouts (
        id TEXT PRIMARY KEY,
        worker_id TEXT NOT NULL,
        job_id TEXT,
        amount_paise INTEGER NOT NULL,
        mode TEXT NOT NULL CHECK(mode IN ('upi', 'bank_account')),
        destination TEXT NOT NULL,
        ifsc TEXT,
        utr_number TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'processed' CHECK(status IN ('pending', 'processing', 'processed', 'failed', 'reversed')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 10. Reviews table
    db.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        reviewer_id TEXT NOT NULL,
        reviewer_role TEXT NOT NULL CHECK(reviewer_role IN ('employer', 'worker')),
        worker_id TEXT NOT NULL,
        score REAL NOT NULL CHECK(score >= 1 AND score <= 5),
        comment TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 11. Disputes table
    db.run(`
      CREATE TABLE IF NOT EXISTS disputes (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        raised_by TEXT NOT NULL CHECK(raised_by IN ('employer', 'worker')),
        reason TEXT NOT NULL,
        evidence TEXT,
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'under_review', 'investigating', 'resolved_refund', 'resolved_disburse', 'dismissed')),
        resolution_notes TEXT,
        resolved_by TEXT,
        resolved_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 12. Notifications table
    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        channel TEXT NOT NULL CHECK(channel IN ('in_app', 'in-app', 'whatsapp', 'sms', 'push', 'email')),
        is_read INTEGER NOT NULL DEFAULT 0,
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 13. Audit Logs table (every sensitive action recorded)
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        details TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 14. API Keys (Developer B2B)
    db.run(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        key_hash TEXT NOT NULL UNIQUE,
        key_prefix TEXT NOT NULL,
        rate_limit_per_min INTEGER NOT NULL DEFAULT 60,
        usage_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'revoked')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 15. Referrals
    db.run(`
      CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY,
        referrer_id TEXT NOT NULL,
        referred_phone TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'bonus_paid')),
        reward_amount_paise INTEGER NOT NULL DEFAULT 10000,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 16. Quiz Attempts
    db.run(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id TEXT PRIMARY KEY,
        worker_id TEXT NOT NULL,
        skill TEXT NOT NULL,
        score INTEGER NOT NULL,
        passed INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 17. KYC Records
    db.run(`
      CREATE TABLE IF NOT EXISTS kyc_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        id_type TEXT NOT NULL CHECK(id_type IN ('aadhaar', 'digilocker_iti', 'digilocker_pmkvy')),
        doc_hash TEXT NOT NULL,
        masked_number TEXT NOT NULL,
        verified_at TEXT NOT NULL DEFAULT (datetime('now')),
        status TEXT NOT NULL DEFAULT 'verified'
      );
    `);

    // 18. Fraud Flags
    db.run(`
      CREATE TABLE IF NOT EXISTS fraud_flags (
        id TEXT PRIMARY KEY,
        worker_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        details TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'pending_review', 'cleared', 'approved', 'suspended', 'banned')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 19. Invoices
    db.run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        job_id TEXT NOT NULL,
        employer_id TEXT NOT NULL,
        worker_id TEXT NOT NULL,
        amount_paise INTEGER NOT NULL,
        platform_fee_paise INTEGER NOT NULL,
        gst_paise INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'paid',
        download_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 20. Idempotency store
    db.run(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key TEXT PRIMARY KEY,
        endpoint TEXT NOT NULL,
        response_code INTEGER NOT NULL,
        response_body TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    // Create helpful performance indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_workers_skill ON workers(primary_skill);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_workers_district ON workers(district);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_workers_rating ON workers(reputation_score);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);`);
  });

  // Seed initial data if workers table is empty
  await seedInitialData();
}

export async function seedInitialData(force = false): Promise<void> {
  const existingCount = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM workers;');
  if (!force && existingCount && existingCount.count > 0) {
    return;
  }

  db.transaction(() => {
    // Clean existing tables if force seeding
    if (force) {
      db.run('DELETE FROM job_workers;');
      db.run('DELETE FROM jobs;');
      db.run('DELETE FROM reviews;');
      db.run('DELETE FROM disputes;');
      db.run('DELETE FROM notifications;');
      db.run('DELETE FROM audit_logs;');
      db.run('DELETE FROM workers;');
      db.run('DELETE FROM employers;');
      db.run('DELETE FROM users;');
      db.run('DELETE FROM fraud_flags;');
      db.run('DELETE FROM api_keys;');
      db.run('DELETE FROM referrals;');
      db.run('DELETE FROM invoices;');
    }

    // Insert Admin User
    db.run(`
      INSERT OR REPLACE INTO users (id, phone, name, role, language, status)
      VALUES (?, ?, ?, ?, ?, ?);
    `, ['admin-01', '+919999900000', 'Chief Administrator', 'admin', 'en', 'active']);

    // Insert Workers
    for (const w of SEED_WORKERS) {
      db.run(`
        INSERT OR REPLACE INTO users (id, phone, name, role, language, status)
        VALUES (?, ?, ?, 'worker', ?, 'active');
      `, [w.id, w.phone, w.name, w.languagesSpoken[0] || 'hi']);

      db.run(`
        INSERT OR REPLACE INTO workers (
          id, phone, name, primary_skill, secondary_skills, experience_years,
          languages_spoken, district, state, pincode, lat, lng,
          voice_profile_url, voice_transcript, profile_pic_url,
          aadhaar_verified, reputation_score, total_jobs, is_available,
          status, verified_skill_badges, portfolio_video_url, wallet_balance_paise
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        w.id,
        w.phone,
        w.name,
        w.primarySkill,
        JSON.stringify(w.secondarySkills),
        w.experienceYears,
        JSON.stringify(w.languagesSpoken),
        w.district,
        w.state,
        w.pincode,
        w.lat,
        w.lng,
        w.voiceProfileUrl || '',
        w.voiceTranscript || '',
        w.profilePicUrl || '',
        w.aadhaarVerified ? 1 : 0,
        w.reputationScore,
        w.totalJobs,
        w.isAvailable ? 1 : 0,
        w.status,
        JSON.stringify(w.verifiedSkillBadges),
        w.portfolioVideoUrl || '',
        Math.floor(Math.random() * 500000) // 0 to 5000 INR
      ]);
    }

    // Insert Employers
    for (const e of SEED_EMPLOYERS) {
      db.run(`
        INSERT OR REPLACE INTO users (id, phone, name, role, employer_type, language, status)
        VALUES (?, ?, ?, 'employer', ?, 'en', 'active');
      `, [e.id, e.phone, e.name, e.employerType]);

      db.run(`
        INSERT OR REPLACE INTO employers (
          id, phone, email, name, business_name, employer_type,
          district, state, lat, lng, plan, plan_expires_at, total_hires
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        e.id,
        e.phone,
        e.email,
        e.name,
        e.businessName,
        e.employerType,
        e.district,
        e.state,
        e.lat,
        e.lng,
        e.plan,
        e.planExpiresAt,
        e.totalHires
      ]);
    }

    // Insert Jobs
    for (const j of SEED_JOBS) {
      const dailyWagePaise = j.dailyWageInr * 100;
      const platformFeePaise = j.platformFeeInr * 100;
      const totalAmountPaise = j.totalAmountInr * 100;
      const primaryWorkerId = j.workerIds?.[0] || 'w-ngp-01';

      db.run(`
        INSERT OR REPLACE INTO jobs (
          id, employer_id, worker_id, skill_required, description,
          status, start_date, end_date, duration_days,
          daily_wage_paise, platform_fee_paise, total_amount_paise,
          payment_status, payment_id, employer_review_score, worker_review_score, is_group_job
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        j.id,
        j.employerId,
        primaryWorkerId,
        j.skillRequired,
        j.description,
        j.status,
        j.startDate,
        j.endDate,
        j.durationDays,
        dailyWagePaise,
        platformFeePaise,
        totalAmountPaise,
        j.paymentStatus,
        j.paymentIds?.paymentId || '',
        j.employerReviewScore || null,
        j.workerReviewScore || null,
        j.isGroupJob ? 1 : 0
      ]);

      // Seed Job Workers mapping
      for (const wId of (j.workerIds || [primaryWorkerId])) {
        db.run(`
          INSERT OR REPLACE INTO job_workers (
            id, job_id, worker_id, worker_status, payout_status, allocated_amount_paise
          ) VALUES (?, ?, ?, ?, ?, ?);
        `, [
          `jw-${j.id}-${wId}`,
          j.id,
          wId,
          j.status === 'in_progress' ? 'in_progress' : j.status === 'completed' ? 'completed' : 'accepted',
          j.paymentStatus === 'paid' ? 'disbursed' : 'pending',
          dailyWagePaise * j.durationDays
        ]);
      }
    }

    // Insert Reviews
    for (const r of SEED_REVIEWS) {
      db.run(`
        INSERT OR REPLACE INTO reviews (id, job_id, reviewer_id, reviewer_role, worker_id, score, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `, [r.id, r.jobId, r.employerId, 'employer', r.workerId, r.rating, r.textReview, r.createdAt]);
    }

    // Insert Disputes
    for (const d of SEED_DISPUTES) {
      db.run(`
        INSERT OR REPLACE INTO disputes (id, job_id, raised_by, reason, evidence, status, resolution_notes, resolved_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [d.id, d.jobId, d.raisedBy, d.reason, '', d.status, d.notes || d.resolutionOutcome || '', d.mediatorName || '', d.createdAt]);
    }

    // Insert Notifications
    for (const n of SEED_NOTIFICATIONS) {
      db.run(`
        INSERT OR REPLACE INTO notifications (id, user_id, title, message, channel, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `, [n.id, n.userId, n.title, n.message, n.channel, n.read ? 1 : 0, n.createdAt]);
    }

    // Insert Audit Logs
    for (const a of SEED_AUDIT_LOGS) {
      db.run(`
        INSERT OR REPLACE INTO audit_logs (id, actor_id, actor_role, action, entity_type, entity_id, ip_address, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [a.id, a.actorId, a.actorRole, a.action, a.entityType, a.entityId, '127.0.0.1', a.details, a.timestamp]);
    }

    // Insert Fraud Flags
    for (const f of SEED_FRAUD_QUEUE) {
      db.run(`
        INSERT OR REPLACE INTO fraud_flags (id, worker_id, reason, severity, details, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `, [f.id, f.workerId || '', f.flagType, f.severity, f.description, f.status, f.flaggedAt]);
    }

    // Seed Invoices
    const SEED_INVOICES = [
      {
        id: 'inv-01',
        invoiceNumber: 'INV-2026-0089',
        jobId: 'job-01',
        employerId: 'emp-01',
        workerId: 'w-ngp-01',
        amountInr: 4250,
        platformFeeInr: 250,
        gstInr: 45,
        status: 'paid',
        downloadUrl: '/api/v1/invoices/inv-01/pdf',
        createdAt: '2026-10-11T14:30:00.000Z'
      },
      {
        id: 'inv-02',
        invoiceNumber: 'INV-2026-0090',
        jobId: 'job-02',
        employerId: 'emp-01',
        workerId: 'w-ngp-02',
        amountInr: 2400,
        platformFeeInr: 150,
        gstInr: 27,
        status: 'paid',
        downloadUrl: '/api/v1/invoices/inv-02/pdf',
        createdAt: '2026-10-04T12:00:00.000Z'
      }
    ];

    for (const inv of SEED_INVOICES) {
      db.run(`
        INSERT OR REPLACE INTO invoices (
          id, invoice_number, job_id, employer_id, worker_id, amount_paise, platform_fee_paise, gst_paise, status, download_url, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        inv.id,
        inv.invoiceNumber,
        inv.jobId,
        inv.employerId,
        inv.workerId,
        inv.amountInr * 100,
        inv.platformFeeInr * 100,
        inv.gstInr * 100,
        inv.status,
        inv.downloadUrl || '',
        inv.createdAt
      ]);
    }

    // Seed Developer API Keys
    const SEED_API_KEYS = [
      {
        id: 'key-01',
        userId: 'emp-01',
        name: 'Construction Portal Sync',
        prefix: 'sk_live_sb_',
        rateLimitPerMinute: 60,
        usageCount: 1420,
        status: 'active',
        createdAt: '2026-08-01T00:00:00.000Z'
      }
    ];

    for (const k of SEED_API_KEYS) {
      db.run(`
        INSERT OR REPLACE INTO api_keys (
          id, user_id, name, key_hash, key_prefix, rate_limit_per_min, usage_count, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        k.id,
        k.userId,
        k.name,
        bcrypt.hashSync(k.prefix + 'secret', 8),
        k.prefix,
        k.rateLimitPerMinute,
        k.usageCount,
        k.status,
        k.createdAt
      ]);
    }
  });

  console.log('✅ SQLite Database successfully initialized and seeded with 40+ workers & relations.');
}
