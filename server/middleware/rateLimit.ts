import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Custom key generator that safely extracts client IP from Forwarded, X-Forwarded-For, or socket
const clientIpKeyGenerator = (req: Request): string => {
  // 1. Check Standardized 'Forwarded' header (RFC 7239: for=192.0.2.60;proto=http;by=203.0.113.43)
  const forwardedHeader = req.headers['forwarded'];
  if (forwardedHeader && typeof forwardedHeader === 'string') {
    const forMatch = forwardedHeader.match(/for=(?:"?\[?)([a-f0-9.:]+)(?:]?"?)/i);
    if (forMatch?.[1]) {
      return forMatch[1];
    }
  }

  // 2. Check de-facto 'X-Forwarded-For' header
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ip = typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0].trim() : xForwardedFor[0];
    if (ip) return ip;
  }

  // 3. Fallback to Express request IP or socket address
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    }
  }
});

export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 30, // 30 attempts per 5 mins
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please wait 5 minutes.'
    }
  }
});

export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 20, // 20 requests per minute
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: false,
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'AI processing rate limit reached, please wait a moment.'
    }
  }
});
