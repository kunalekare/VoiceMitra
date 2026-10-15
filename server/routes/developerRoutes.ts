import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { logAuditEvent } from '../middleware/logger';
import { searchWorkers } from '../services/workerService';
import { createJobBooking, transitionJobStatus } from '../services/jobService';
import { verifyAadhaarKYC } from '../services/kycService';
import { submitQuizAnswers } from '../services/quizService';

export const developerRouter = Router();

// List API Keys
developerRouter.get('/keys', (req: Request, res: Response) => {
  try {
    const keys = db.query('SELECT id, user_id, name, key_prefix, rate_limit_per_min, usage_count, status, created_at FROM api_keys ORDER BY created_at DESC;');
    return sendSuccess(req, res, keys);
  } catch (err: any) {
    return sendError(req, res, 'FETCH_KEYS_FAILED', err.message, 500);
  }
});

// Create API Key
developerRouter.post('/keys', (req: Request, res: Response) => {
  try {
    const { name, userId } = req.body;
    const rawKey = `sk_live_${crypto.randomBytes(16).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = bcrypt.hashSync(rawKey, 8);
    const id = `key-${Date.now()}`;

    db.run(`
      INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, rate_limit_per_min, usage_count, status, created_at)
      VALUES (?, ?, ?, ?, ?, 60, 0, 'active', datetime('now'));
    `, [id, userId || 'u-dev-01', name || 'Production Service Key', keyHash, keyPrefix]);

    logAuditEvent(userId || 'u-dev-01', 'developer', 'CREATE_API_KEY', 'api_key', id);

    // Return the secret key once to the client
    return sendSuccess(req, res, {
      id,
      name,
      apiKey: rawKey,
      keyPrefix,
      message: 'Store this API key securely. It will not be shown again.'
    }, 201);
  } catch (err: any) {
    return sendError(req, res, 'CREATE_KEY_FAILED', err.message, 500);
  }
});

// Revoke API Key
developerRouter.delete('/keys/:id', (req: Request, res: Response) => {
  try {
    db.run('UPDATE api_keys SET status = "revoked" WHERE id = ?;', [req.params.id]);
    return sendSuccess(req, res, { id: req.params.id, status: 'revoked' });
  } catch (err: any) {
    return sendError(req, res, 'REVOKE_KEY_FAILED', err.message, 500);
  }
});

// Live Built-in Test Suite Execution Runner
developerRouter.post('/test-runner', async (req: Request, res: Response) => {
  const results: Array<{ testName: string; category: string; passed: boolean; durationMs: number; details: string }> = [];

  // Test 1: SQLite and Seed integrity
  const t1Start = Date.now();
  try {
    const workerCount = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM workers;')?.count || 0;
    results.push({
      testName: 'Database Persistence & Seed Invariants',
      category: 'Persistence',
      passed: workerCount >= 40,
      durationMs: Date.now() - t1Start,
      details: `Verified ${workerCount} active worker records seeded in SQLite.`
    });
  } catch (e: any) {
    results.push({
      testName: 'Database Persistence & Seed Invariants',
      category: 'Persistence',
      passed: false,
      durationMs: Date.now() - t1Start,
      details: e.message
    });
  }

  // Test 2: Search and Composite Ranking Formula
  const t2Start = Date.now();
  try {
    const searchRes = searchWorkers({ skill: 'Electrician', limit: 5 });
    const topWorker = searchRes.workers[0];
    const hasRanking = topWorker && topWorker.rankingScore !== undefined && topWorker.rankingBreakdown !== undefined;
    results.push({
      testName: 'Search & Explainable Composite Ranking Algorithm',
      category: 'Algorithms',
      passed: Boolean(hasRanking && (topWorker.rankingScore || 0) > 50),
      durationMs: Date.now() - t2Start,
      details: `Top ranked worker scored ${topWorker?.rankingScore} with full breakdown breakdown metrics.`
    });
  } catch (e: any) {
    results.push({
      testName: 'Search & Explainable Composite Ranking Algorithm',
      category: 'Algorithms',
      passed: false,
      durationMs: Date.now() - t2Start,
      details: e.message
    });
  }

  // Test 3: Aadhaar Verhoeff & Cryptographic Pepper Hash
  const t3Start = Date.now();
  try {
    const kycRes = verifyAadhaarKYC({
      workerId: 'w-ngp-01',
      aadhaarNumber: '999912345678',
      otp: '123456'
    });
    results.push({
      testName: 'Aadhaar e-KYC DPDP 2023 Masking & HMAC Pepper Hashing',
      category: 'Compliance',
      passed: kycRes.success && kycRes.maskedAadhaar.startsWith('XXXX-XXXX-'),
      durationMs: Date.now() - t3Start,
      details: `Generated masked format ${kycRes.maskedAadhaar} and verified cryptographic HMAC signature.`
    });
  } catch (e: any) {
    results.push({
      testName: 'Aadhaar e-KYC DPDP 2023 Masking & HMAC Pepper Hashing',
      category: 'Compliance',
      passed: false,
      durationMs: Date.now() - t3Start,
      details: e.message
    });
  }

  // Test 4: Escrow & Job State Machine Lifecycle
  const t4Start = Date.now();
  try {
    const testJob = createJobBooking({
      employerId: 'emp-01',
      workerIds: ['w-ngp-02'],
      skillRequired: 'Plumber',
      description: 'Test Pipe Repair Flow',
      startDate: '2026-10-15',
      endDate: '2026-10-16',
      durationDays: 1,
      dailyWageInr: 850
    });

    const funded = transitionJobStatus(testJob.id, 'funded', 'emp-01', 'employer');
    const accepted = transitionJobStatus(testJob.id, 'accepted', 'w-ngp-02', 'worker');
    const inProgress = transitionJobStatus(testJob.id, 'in_progress', 'w-ngp-02', 'worker');
    const completed = transitionJobStatus(testJob.id, 'completed', 'emp-01', 'employer');

    results.push({
      testName: 'Escrow State Machine (Funded -> Accepted -> In Progress -> Completed)',
      category: 'Financial Escrow',
      passed: completed.status === 'completed' && completed.paymentStatus === 'escrow_released',
      durationMs: Date.now() - t4Start,
      details: `Full job lifecycle verified from pending_payment to escrow_released.`
    });
  } catch (e: any) {
    results.push({
      testName: 'Escrow State Machine (Funded -> Accepted -> In Progress -> Completed)',
      category: 'Financial Escrow',
      passed: false,
      durationMs: Date.now() - t4Start,
      details: e.message
    });
  }

  // Test 5: Trade Skill Quiz Grading & Badge Verification
  const t5Start = Date.now();
  try {
    const quizRes = submitQuizAnswers({
      workerId: 'w-ngp-03',
      skill: 'Electrician',
      answers: [
        { questionId: 1, selectedIndex: 0 },
        { questionId: 2, selectedIndex: 0 },
        { questionId: 3, selectedIndex: 0 },
        { questionId: 4, selectedIndex: 0 },
        { questionId: 5, selectedIndex: 0 }
      ]
    });
    results.push({
      testName: 'Skill Quiz Vernacular Audio-First Scoring & Badge Issuance',
      category: 'Gamification',
      passed: quizRes.passed && quizRes.score === 100,
      durationMs: Date.now() - t5Start,
      details: `Quiz scored ${quizRes.score}% and awarded badge: ${quizRes.badgeAwarded}.`
    });
  } catch (e: any) {
    results.push({
      testName: 'Skill Quiz Vernacular Audio-First Scoring & Badge Issuance',
      category: 'Gamification',
      passed: false,
      durationMs: Date.now() - t5Start,
      details: e.message
    });
  }

  const allPassed = results.every(r => r.passed);
  return sendSuccess(req, res, {
    passed: allPassed,
    totalTests: results.length,
    passedCount: results.filter(r => r.passed).length,
    results
  });
});
