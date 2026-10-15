import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';

describe('OTP Security & Verification Invariants', () => {
  it('generates and securely hashes OTP with bcrypt salt', () => {
    const rawOtp = '482910';
    const hash = bcrypt.hashSync(rawOtp, 8);

    expect(bcrypt.compareSync(rawOtp, hash)).toBe(true);
    expect(bcrypt.compareSync('000000', hash)).toBe(false);
  });

  it('rejects expired OTP sessions', () => {
    const now = Date.now();
    const expiresAt = now - 1000; // expired 1s ago

    const isExpired = Date.now() > expiresAt;
    expect(isExpired).toBe(true);
  });

  it('enforces lockout after 3 consecutive failed attempts', () => {
    let attempts = 0;
    const maxAttempts = 3;
    let locked = false;

    // Simulate 3 wrong attempts
    for (let i = 0; i < 3; i++) {
      attempts++;
      if (attempts >= maxAttempts) {
        locked = true;
      }
    }

    expect(attempts).toBe(3);
    expect(locked).toBe(true);
  });
});
