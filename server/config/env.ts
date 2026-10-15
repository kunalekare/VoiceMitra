import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  JWT_ACCESS_SECRET: z.string().default('skillbridge_jwt_access_secret_production_2026_xyz'),
  JWT_REFRESH_SECRET: z.string().default('skillbridge_jwt_refresh_secret_production_2026_abc'),
  PEPPER_SECRET: z.string().default('skillbridge_pepper_salt_secret_hash_2026'),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
  CORS_ORIGIN: z.string().default('*'),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SENTRY_DSN: z.string().optional().default('')
});

export const ENV = envSchema.parse(process.env);
