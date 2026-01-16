// PreSocial Rate Limiting Middleware
// Protects API from abuse

import { Context, Next } from 'hono';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 60000); // Cleanup every minute

interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
  keyGenerator?: (c: Context) => string;
}

const defaultOptions: RateLimitOptions = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
};

export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const config = { ...defaultOptions, ...options };

  return async (c: Context, next: Next) => {
    // Generate key from IP or custom function
    const key = config.keyGenerator
      ? config.keyGenerator(c)
      : getClientIp(c) || 'unknown';

    const now = Date.now();
    const record = store[key];

    // Initialize or reset if window expired
    if (!record || record.resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
    } else {
      store[key].count++;
    }

    const current = store[key];
    const remaining = Math.max(0, config.max - current.count);
    const resetSeconds = Math.ceil((current.resetTime - now) / 1000);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', config.max.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', resetSeconds.toString());

    // Check if over limit
    if (current.count > config.max) {
      c.header('Retry-After', resetSeconds.toString());
      return c.json({
        error: 'Too many requests',
        retryAfter: resetSeconds,
      }, 429);
    }

    await next();
  };
}

/**
 * Extract client IP from request
 */
function getClientIp(c: Context): string | null {
  // Try various headers that might contain the real IP
  const headers = [
    'cf-connecting-ip',  // Cloudflare
    'x-real-ip',
    'x-forwarded-for',
  ];

  for (const header of headers) {
    const value = c.req.header(header);
    if (value) {
      // X-Forwarded-For may contain multiple IPs, take the first
      return value.split(',')[0].trim();
    }
  }

  return null;
}

/**
 * Stricter rate limit for authenticated actions
 */
export const authRateLimit = rateLimit({
  windowMs: 60000,  // 1 minute
  max: 10,          // 10 requests per minute for auth actions
});

/**
 * Standard rate limit for search queries
 */
export const searchRateLimit = rateLimit({
  windowMs: 60000,  // 1 minute
  max: 60,          // 60 searches per minute
});
