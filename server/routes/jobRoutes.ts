import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createJobBooking, transitionJobStatus, getJobsForEmployer, getJobsForWorker } from '../services/jobService';
import { processVoiceJobMatch } from '../services/geminiService';
import { sendSuccess, sendError } from '../utils/response';
import { enforceIdempotency } from '../middleware/idempotency';
import { aiLimiter } from '../middleware/rateLimit';
import { db } from '../config/database';
import { logAuditEvent } from '../middleware/logger';

export const jobRouter = Router();

// Create Job (Single or Group Hire)
jobRouter.post('/hire', enforceIdempotency, (req: Request, res: Response) => {
  try {
    const {
      employerId,
      workerIds,
      workerId,
      skillRequired,
      description,
      startDate,
      endDate,
      durationDays,
      dailyWageInr,
      employerPlan
    } = req.body;

    const allWorkerIds = workerIds && workerIds.length > 0 ? workerIds : [workerId];

    const job = createJobBooking({
      employerId: employerId || 'emp-01',
      workerIds: allWorkerIds,
      skillRequired: skillRequired || 'Electrician',
      description: description || 'Trade assignment',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      durationDays: durationDays || 1,
      dailyWageInr: dailyWageInr || 800,
      employerPlan: employerPlan || 'free'
    });

    return sendSuccess(req, res, job, 201);
  } catch (err: any) {
    return sendError(req, res, 'HIRE_FAILED', err.message, 400);
  }
});

// Transition Job Status
jobRouter.post('/:id/transition', (req: Request, res: Response) => {
  try {
    const { status, actorId, actorRole } = req.body;
    if (!status) {
      return sendError(req, res, 'MISSING_STATUS', 'Target status required', 400);
    }

    const updated = transitionJobStatus(
      req.params.id,
      status,
      actorId || req.user?.id || 'system',
      actorRole || req.user?.role || 'employer'
    );

    return sendSuccess(req, res, updated);
  } catch (err: any) {
    return sendError(req, res, 'TRANSITION_FAILED', err.message, 400);
  }
});

// Employer Jobs
jobRouter.get('/employer/:employerId', (req: Request, res: Response) => {
  try {
    const jobs = getJobsForEmployer(req.params.employerId);
    return sendSuccess(req, res, jobs);
  } catch (err: any) {
    return sendError(req, res, 'FETCH_JOBS_FAILED', err.message, 500);
  }
});

// Worker Jobs
jobRouter.get('/worker/:workerId', (req: Request, res: Response) => {
  try {
    const jobs = getJobsForWorker(req.params.workerId);
    return sendSuccess(req, res, jobs);
  } catch (err: any) {
    return sendError(req, res, 'FETCH_JOBS_FAILED', err.message, 500);
  }
});

// AI Voice Job Match
jobRouter.post('/voice-match', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { audioBase64, textInput } = req.body;
    const match = await processVoiceJobMatch(audioBase64, textInput);
    return sendSuccess(req, res, match);
  } catch (err: any) {
    return sendError(req, res, 'VOICE_MATCH_FAILED', err.message, 500);
  }
});

// Review Submission
jobRouter.post('/:id/review', (req: Request, res: Response) => {
  try {
    const { reviewerId, reviewerRole, workerId, score, comment } = req.body;
    const reviewId = `rev-${Date.now()}`;

    db.transaction(() => {
      db.run(`
        INSERT INTO reviews (id, job_id, reviewer_id, reviewer_role, worker_id, score, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'));
      `, [
        reviewId,
        req.params.id,
        reviewerId || 'emp-01',
        reviewerRole || 'employer',
        workerId,
        score,
        comment || ''
      ]);

      if (reviewerRole === 'employer') {
        db.run('UPDATE jobs SET employer_review_score = ? WHERE id = ?;', [score, req.params.id]);
        // Update worker reputation score atomically
        const avg = db.queryOne<{ avg_score: number }>('SELECT AVG(score) as avg_score FROM reviews WHERE worker_id = ?;', [workerId]);
        if (avg && avg.avg_score) {
          const rounded = Math.round(avg.avg_score * 10) / 10;
          db.run('UPDATE workers SET reputation_score = ? WHERE id = ?;', [rounded, workerId]);
        }
      } else {
        db.run('UPDATE jobs SET worker_review_score = ? WHERE id = ?;', [score, req.params.id]);
      }
    });

    logAuditEvent(reviewerId || 'user', reviewerRole || 'employer', 'SUBMIT_REVIEW', 'review', reviewId);

    return sendSuccess(req, res, { reviewId, score, message: 'Review recorded and reputation updated' });
  } catch (err: any) {
    return sendError(req, res, 'REVIEW_FAILED', err.message, 400);
  }
});
