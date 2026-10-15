import { Router, Request, Response } from 'express';
import { openDispute, resolveDispute, getAllDisputes } from '../services/disputeService';
import { sendSuccess, sendError } from '../utils/response';

export const disputeRouter = Router();

// List all disputes
disputeRouter.get('/', (req: Request, res: Response) => {
  try {
    const disputes = getAllDisputes();
    return sendSuccess(req, res, disputes);
  } catch (err: any) {
    return sendError(req, res, 'FETCH_DISPUTES_FAILED', err.message, 500);
  }
});

// Raise a Dispute
disputeRouter.post('/open', (req: Request, res: Response) => {
  try {
    const { jobId, raisedBy, reason, evidence, actorId } = req.body;
    if (!jobId || !reason) {
      return sendError(req, res, 'MISSING_FIELDS', 'jobId and reason are required', 400);
    }

    const dispute = openDispute({
      jobId,
      raisedBy: raisedBy || 'employer',
      reason,
      evidence,
      actorId: actorId || 'user'
    });

    return sendSuccess(req, res, dispute, 201);
  } catch (err: any) {
    return sendError(req, res, 'OPEN_DISPUTE_FAILED', err.message, 400);
  }
});

// Resolve Dispute (Admin)
disputeRouter.post('/:id/resolve', (req: Request, res: Response) => {
  try {
    const { resolution, notes, adminId } = req.body;
    if (!resolution || !['resolve_refund', 'resolve_disburse', 'dismissed'].includes(resolution)) {
      return sendError(req, res, 'INVALID_RESOLUTION', 'Invalid resolution value', 400);
    }

    const updated = resolveDispute({
      disputeId: req.params.id,
      resolution,
      notes: notes || 'Resolved by administrative review',
      adminId: adminId || 'admin-01'
    });

    return sendSuccess(req, res, updated);
  } catch (err: any) {
    return sendError(req, res, 'RESOLVE_DISPUTE_FAILED', err.message, 400);
  }
});
