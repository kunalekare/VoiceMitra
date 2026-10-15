/**
 * MSG91 / Fast2SMS SMS Gateway Integration Service
 * 
 * Provides phone number OTP delivery, rate-limiting, and verification.
 * In production:
 * // swap with real API:
 * // const response = await fetch('https://api.msg91.com/api/v5/otp', {
 * //   method: 'POST',
 * //   headers: { 'authkey': process.env.MSG91_AUTH_KEY, 'content-type': 'application/json' },
 * //   body: JSON.stringify({ template_id: 'MSG91_TEMPLATE_ID', mobile: `91${phone}`, otp })
 * // });
 */

export interface OtpSessionState {
  phone: string;
  expectedOtp: string;
  attemptsLeft: number;
  expiresAt: number; // timestamp
  resendAvailableAt: number; // timestamp
}

const activeOtpSessions: Map<string, OtpSessionState> = new Map();

export const otpService = {
  /**
   * Sends an OTP to the given phone number.
   * Mock default OTP is 123456 with 5-min expiry and 3 attempts max.
   */
  sendOtp: async (phone: string): Promise<{ success: boolean; message: string; resendTimerSeconds: number }> => {
    const cleanPhone = phone.replace(/\D/g, '');
    const now = Date.now();

    const existing = activeOtpSessions.get(cleanPhone);
    if (existing && existing.resendAvailableAt > now) {
      const waitSeconds = Math.ceil((existing.resendAvailableAt - now) / 1000);
      return {
        success: false,
        message: `Please wait ${waitSeconds}s before requesting a new OTP.`,
        resendTimerSeconds: waitSeconds
      };
    }

    // Default mock OTP is 123456 (or randomized if requested)
    const expectedOtp = '123456';
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes expiry
    const resendAvailableAt = now + 30 * 1000; // 30 seconds resend cooldown

    activeOtpSessions.set(cleanPhone, {
      phone: cleanPhone,
      expectedOtp,
      attemptsLeft: 3,
      expiresAt,
      resendAvailableAt
    });

    // Simulated network latency
    await new Promise((resolve) => setTimeout(resolve, 350));

    // In production:
    // // swap with real API:
    // // await axios.post('https://api.msg91.com/api/v5/otp?template_id=...', { mobile: cleanPhone, otp: expectedOtp });

    return {
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone.slice(-10)}. (Demo OTP: 123456)`,
      resendTimerSeconds: 30
    };
  },

  /**
   * Verifies the OTP with attempt limit (max 3) and expiry checks.
   */
  verifyOtp: async (phone: string, otpEntered: string): Promise<{
    valid: boolean;
    message: string;
    attemptsLeft?: number;
    token?: string;
  }> => {
    const cleanPhone = phone.replace(/\D/g, '');
    const session = activeOtpSessions.get(cleanPhone);
    const now = Date.now();

    // Simulated latency
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Allow default demo override for 123456 regardless of initial trigger if in demo mode
    if (!session) {
      if (otpEntered === '123456') {
        return {
          valid: true,
          message: 'OTP verified successfully (Demo Session)',
          token: `jwt_mock_${cleanPhone}_${Date.now()}`
        };
      }
      return {
        valid: false,
        message: 'No active OTP request found. Please request an OTP first.'
      };
    }

    if (now > session.expiresAt) {
      activeOtpSessions.delete(cleanPhone);
      return {
        valid: false,
        message: 'OTP has expired (valid for 5 minutes). Please request a new one.'
      };
    }

    if (session.attemptsLeft <= 0) {
      return {
        valid: false,
        message: 'Maximum verification attempts (3) exceeded. Please request a new OTP.'
      };
    }

    if (otpEntered.trim() === session.expectedOtp || otpEntered.trim() === '123456') {
      activeOtpSessions.delete(cleanPhone);
      const mockJwtToken = `jwt_mock_${cleanPhone}_${Date.now()}`;
      return {
        valid: true,
        message: 'OTP verified successfully.',
        token: mockJwtToken
      };
    }

    session.attemptsLeft -= 1;
    return {
      valid: false,
      message: `Invalid OTP. ${session.attemptsLeft} attempt(s) remaining.`,
      attemptsLeft: session.attemptsLeft
    };
  }
};
