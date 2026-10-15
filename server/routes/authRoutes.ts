import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requestOtp, verifyOtpAndLogin, rotateRefreshToken } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { authLimiter } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { db } from '../config/database';

export const authRouter = Router();

const requestOtpSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit phone number is required')
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().min(4).max(6),
  preferredRole: z.enum(['worker', 'employer', 'admin']).optional(),
  name: z.string().optional()
});

// Request OTP
authRouter.post('/request-otp', authLimiter, validateBody(requestOtpSchema), (req: Request, res: Response) => {
  try {
    const result = requestOtp(req.body.phone);
    return sendSuccess(req, res, result);
  } catch (err: any) {
    return sendError(req, res, 'OTP_REQUEST_FAILED', err.message, 400);
  }
});

// Verify OTP & Login
authRouter.post('/verify-otp', authLimiter, validateBody(verifyOtpSchema), (req: Request, res: Response) => {
  try {
    const { phone, otp, preferredRole, name } = req.body;
    const result = verifyOtpAndLogin(phone, otp, preferredRole, name);

    // Set HTTP-only cookies
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return sendSuccess(req, res, {
      user: result.user,
      accessToken: result.accessToken
    });
  } catch (err: any) {
    return sendError(req, res, 'LOGIN_FAILED', err.message, 401);
  }
});

// Refresh token
authRouter.post('/refresh', (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!refreshToken) {
      return sendError(req, res, 'NO_REFRESH_TOKEN', 'Refresh token required', 400);
    }

    const result = rotateRefreshToken(refreshToken);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(req, res, {
      user: result.user,
      accessToken: result.accessToken
    });
  } catch (err: any) {
    return sendError(req, res, 'REFRESH_FAILED', err.message, 401);
  }
});

// Get current user profile
authRouter.get('/me', authenticate, (req: Request, res: Response) => {
  const user = db.queryOne('SELECT id, phone, name, role, employer_type, language, status FROM users WHERE id = ?;', [
    req.user!.id
  ]);
  if (!user) {
    return sendError(req, res, 'USER_NOT_FOUND', 'User profile not found', 404);
  }
  return sendSuccess(req, res, user);
});

// Update preferred language
authRouter.patch('/me/language', authenticate, (req: Request, res: Response) => {
  const { language } = req.body;
  if (!language) {
    return sendError(req, res, 'INVALID_LANGUAGE', 'Language code is required', 400);
  }
  db.run('UPDATE users SET language = ?, preferred_language = ?, updated_at = datetime("now") WHERE id = ?;', [
    language,
    language,
    req.user!.id
  ]);
  return sendSuccess(req, res, { language, preferred_language: language });
});

// Logout
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  return sendSuccess(req, res, { message: 'Logged out successfully' });
});
