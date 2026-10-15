import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const RegistrationSchema = z.object({
  phone: z.string().min(10).max(15),
  name: z.string().min(2),
  role: z.enum(['worker', 'employer', 'admin']),
  primarySkill: z.string().optional(),
  experienceYears: z.number().min(0).max(60).optional(),
  dailyWageExpected: z.number().positive().optional()
});

const JobMatchSchema = z.object({
  skillRequired: z.string().min(2),
  urgency: z.enum(['immediate', 'within_3_days', 'flexible']),
  durationDays: z.number().int().min(1).max(90),
  dailyBudget: z.number().positive(),
  description: z.string().min(5)
});

describe('Zod Input Validation Invariants', () => {
  it('validates worker registration inputs successfully', () => {
    const validWorker = {
      phone: '+919822011201',
      name: 'Rameshwar Patil',
      role: 'worker',
      primarySkill: 'Electrician',
      experienceYears: 9,
      dailyWageExpected: 850
    };

    const parsed = RegistrationSchema.safeParse(validWorker);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid or unsafe phone formats', () => {
    const invalidWorker = {
      phone: '123',
      name: 'R',
      role: 'worker'
    };

    const parsed = RegistrationSchema.safeParse(invalidWorker);
    expect(parsed.success).toBe(false);
  });

  it('validates and clamps AI voice job match payloads', () => {
    const validJob = {
      skillRequired: 'Plumber',
      urgency: 'immediate',
      durationDays: 3,
      dailyBudget: 900,
      description: 'Fix pipeline leakage in kitchen and bathroom'
    };

    const parsed = JobMatchSchema.safeParse(validJob);
    expect(parsed.success).toBe(true);
  });
});
