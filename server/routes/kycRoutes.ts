import { Router, Request, Response } from 'express';
import { verifyAadhaarKYC, verifyDigiLockerCertificate } from '../services/kycService';
import { sendSuccess, sendError } from '../utils/response';

export const kycRouter = Router();

// Aadhaar e-KYC Verification
kycRouter.post('/aadhaar/verify', (req: Request, res: Response) => {
  try {
    const { workerId, aadhaarNumber, otp } = req.body;
    if (!workerId || !aadhaarNumber || !otp) {
      return sendError(req, res, 'MISSING_FIELDS', 'workerId, aadhaarNumber, and otp are required', 400);
    }

    const result = verifyAadhaarKYC({ workerId, aadhaarNumber, otp });
    return sendSuccess(req, res, result);
  } catch (err: any) {
    return sendError(req, res, 'KYC_FAILED', err.message, 400);
  }
});

// DigiLocker Certificate Verification
kycRouter.post('/digilocker/verify', (req: Request, res: Response) => {
  try {
    const { workerId, certificateType, certNumber } = req.body;
    if (!workerId || !certificateType || !certNumber) {
      return sendError(req, res, 'MISSING_FIELDS', 'workerId, certificateType, and certNumber are required', 400);
    }

    const result = verifyDigiLockerCertificate({
      workerId,
      certificateType: certificateType.toUpperCase() as any,
      certNumber
    });

    return sendSuccess(req, res, result);
  } catch (err: any) {
    return sendError(req, res, 'DIGILOCKER_FAILED', err.message, 400);
  }
});
