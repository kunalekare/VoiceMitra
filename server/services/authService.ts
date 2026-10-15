import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { ENV } from '../config/env';
import { logAuditEvent } from '../middleware/logger';
import { AuthUser } from '../middleware/auth';

export interface OtpSession {
  phone: string;
  hashed_otp: string;
  attempts: number;
  expires_at: number;
  resend_after: number;
  locked_until: number;
}

export interface UserRow {
  id: string;
  phone: string;
  name: string;
  role: 'worker' | 'employer' | 'admin';
  employer_type?: 'household' | 'contractor' | 'small_business' | 'enterprise';
  language: string;
  status: string;
  created_at: string;
}

export function requestOtp(phone: string): { success: boolean; message: string; resendInSeconds: number; devOtp?: string } {
  const cleanPhone = phone.trim();
  const now = Date.now();

  // Check existing session
  const session = db.queryOne<OtpSession>('SELECT * FROM otp_sessions WHERE phone = ?;', [cleanPhone]);

  if (session) {
    if (session.locked_until > now) {
      const waitMins = Math.ceil((session.locked_until - now) / 60000);
      throw new Error(`Account temporarily locked due to multiple failed attempts. Please try again in ${waitMins} minute(s).`);
    }

    if (session.resend_after > now) {
      const waitSecs = Math.ceil((session.resend_after - now) / 1000);
      throw new Error(`Please wait ${waitSecs} seconds before requesting a new OTP.`);
    }
  }

  // Generate 6 digit OTP. In development / testing: 123456
  const isDev = ENV.NODE_ENV !== 'production';
  const otpCode = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = bcrypt.hashSync(otpCode, 8);

  const expiresAt = now + 5 * 60 * 1000; // 5 minutes
  const resendAfter = now + 45 * 1000;   // 45 seconds cooldown

  db.run(`
    INSERT OR REPLACE INTO otp_sessions (phone, hashed_otp, attempts, expires_at, resend_after, locked_until, created_at)
    VALUES (?, ?, 0, ?, ?, 0, ?);
  `, [cleanPhone, hashedOtp, expiresAt, resendAfter, now]);

  logAuditEvent(cleanPhone, 'guest', 'REQUEST_OTP', 'otp_session', cleanPhone, undefined, { expiresAt });

  return {
    success: true,
    message: 'OTP sent successfully to ' + cleanPhone,
    resendInSeconds: 45,
    devOtp: isDev ? otpCode : undefined
  };
}

export function verifyOtpAndLogin(
  phone: string,
  otp: string,
  preferredRole?: 'worker' | 'employer' | 'admin',
  userName?: string
): { user: UserRow; accessToken: string; refreshToken: string } {
  const cleanPhone = phone.trim();
  const cleanOtp = otp.trim();
  const now = Date.now();

  const session = db.queryOne<OtpSession>('SELECT * FROM otp_sessions WHERE phone = ?;', [cleanPhone]);

  if (!session) {
    // If dev mode and 123456 entered, allow fallback
    if (ENV.NODE_ENV !== 'production' && cleanOtp === '123456') {
      // allow proceed
    } else {
      throw new Error('No active OTP session found. Please request a new OTP.');
    }
  } else {
    if (session.locked_until > now) {
      const waitMins = Math.ceil((session.locked_until - now) / 60000);
      throw new Error(`Account locked. Please retry after ${waitMins} minute(s).`);
    }

    if (session.expires_at < now) {
      db.run('DELETE FROM otp_sessions WHERE phone = ?;', [cleanPhone]);
      throw new Error('OTP has expired. Please request a new one.');
    }

    const isMatch = bcrypt.compareSync(cleanOtp, session.hashed_otp);
    if (!isMatch) {
      const newAttempts = session.attempts + 1;
      if (newAttempts >= 3) {
        const lockoutUntil = now + 15 * 60 * 1000; // 15 min lockout
        db.run('UPDATE otp_sessions SET attempts = ?, locked_until = ? WHERE phone = ?;', [newAttempts, lockoutUntil, cleanPhone]);
        throw new Error('Too many invalid attempts. Your account has been locked for 15 minutes.');
      } else {
        db.run('UPDATE otp_sessions SET attempts = ? WHERE phone = ?;', [newAttempts, cleanPhone]);
        const remaining = 3 - newAttempts;
        throw new Error(`Incorrect OTP. ${remaining} attempt(s) remaining.`);
      }
    }

    // Success: remove session
    db.run('DELETE FROM otp_sessions WHERE phone = ?;', [cleanPhone]);
  }

  // Find or create user
  let user = db.queryOne<UserRow>('SELECT * FROM users WHERE phone = ?;', [cleanPhone]);

  if (!user) {
    const userId = (preferredRole === 'worker' ? 'w-' : preferredRole === 'employer' ? 'emp-' : 'u-') + Date.now().toString(36);
    const assignedRole = preferredRole || 'worker';
    const assignedName = userName || (assignedRole === 'worker' ? 'New Karigar' : 'New Employer');

    db.run(`
      INSERT INTO users (id, phone, name, role, language, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'hi', 'active', datetime('now'), datetime('now'));
    `, [userId, cleanPhone, assignedName, assignedRole]);

    if (assignedRole === 'worker') {
      db.run(`
        INSERT INTO workers (
          id, phone, name, primary_skill, secondary_skills, experience_years,
          languages_spoken, district, state, pincode, lat, lng,
          aadhaar_verified, reputation_score, total_jobs, is_available, status,
          verified_skill_badges, wallet_balance_paise
        ) VALUES (?, ?, ?, 'Electrician', '[]', 2, '["hi"]', 'Nagpur', 'Maharashtra', '440001', 21.1458, 79.0882, 0, 4.5, 0, 1, 'active', '[]', 0);
      `, [userId, cleanPhone, assignedName]);
    } else if (assignedRole === 'employer') {
      db.run(`
        INSERT INTO employers (
          id, phone, email, name, business_name, employer_type, district, state, lat, lng, plan, plan_expires_at, total_hires
        ) VALUES (?, ?, '', ?, '', 'household', 'Nagpur', 'Maharashtra', 21.1458, 79.0882, 'free', '2099-12-31', 0);
      `, [userId, cleanPhone, assignedName]);
    }

    user = db.queryOne<UserRow>('SELECT * FROM users WHERE id = ?;', [userId])!;
  }

  // Create JWT tokens
  const payload: AuthUser = {
    id: user.id,
    phone: user.phone,
    role: user.role,
    name: user.name,
    employerType: user.employer_type
  };

  const accessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  logAuditEvent(user.id, user.role, 'LOGIN_SUCCESS', 'user', user.id);

  return { user, accessToken, refreshToken };
}

export function rotateRefreshToken(token: string): { user: UserRow; accessToken: string; refreshToken: string } {
  try {
    const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET) as AuthUser;
    const user = db.queryOne<UserRow>('SELECT * FROM users WHERE id = ?;', [decoded.id]);
    if (!user || user.status !== 'active') {
      throw new Error('User not found or suspended');
    }

    const payload: AuthUser = {
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
      employerType: user.employer_type
    };

    const newAccessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch {
    throw new Error('Invalid or expired refresh token');
  }
}
