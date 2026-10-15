import { Router, Request, Response } from 'express';
import { createPaymentOrder, verifyPaymentAndFundJob, disburseWorkerPayout, getPayoutsForWorker } from '../services/paymentService';
import { sendSuccess, sendError } from '../utils/response';
import { enforceIdempotency } from '../middleware/idempotency';

export const paymentRouter = Router();

// Create Razorpay Order
paymentRouter.post('/order', (req: Request, res: Response) => {
  try {
    const { jobId, employerId } = req.body;
    if (!jobId) {
      return sendError(req, res, 'MISSING_JOB_ID', 'Job ID required', 400);
    }
    const order = createPaymentOrder(jobId, employerId || 'emp-01');
    return sendSuccess(req, res, order);
  } catch (err: any) {
    return sendError(req, res, 'ORDER_CREATION_FAILED', err.message, 400);
  }
});

// Verify Payment & Fund Escrow
paymentRouter.post('/verify', enforceIdempotency, (req: Request, res: Response) => {
  try {
    const { jobId, employerId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body?.idempotencyKey;

    const result = verifyPaymentAndFundJob({
      jobId,
      employerId: employerId || 'emp-01',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      idempotencyKey
    });

    return sendSuccess(req, res, result);
  } catch (err: any) {
    return sendError(req, res, 'PAYMENT_VERIFICATION_FAILED', err.message, 400);
  }
});

// Disburse Payout (RazorpayX)
paymentRouter.post('/disburse', enforceIdempotency, (req: Request, res: Response) => {
  try {
    const { workerId, amountPaise, amountInr, mode, destination, ifsc, accountHolderName } = req.body;
    const finalPaise = amountPaise || (amountInr ? amountInr * 100 : 0);

    if (!finalPaise || finalPaise <= 0) {
      return sendError(req, res, 'INVALID_AMOUNT', 'Payout amount must be greater than 0', 400);
    }

    const result = disburseWorkerPayout({
      workerId,
      amountPaise: finalPaise,
      mode: mode || 'upi',
      destination,
      ifsc,
      accountHolderName
    });

    return sendSuccess(req, res, result);
  } catch (err: any) {
    return sendError(req, res, 'DISBURSEMENT_FAILED', err.message, 400);
  }
});

// List Payouts for worker
paymentRouter.get('/payouts/:workerId', (req: Request, res: Response) => {
  try {
    const payouts = getPayoutsForWorker(req.params.workerId);
    return sendSuccess(req, res, payouts);
  } catch (err: any) {
    return sendError(req, res, 'FETCH_PAYOUTS_FAILED', err.message, 500);
  }
});
