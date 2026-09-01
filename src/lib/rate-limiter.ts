/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or Vercel KV
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 60000, // 1 minute
};

export function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const { maxAttempts, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  
  const record = attempts.get(identifier);
  
  // Clean up expired entries
  if (record && now > record.resetAt) {
    attempts.delete(identifier);
  }
  
  const currentRecord = attempts.get(identifier);
  
  if (!currentRecord) {
    // First attempt
    attempts.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
  }
  
  if (currentRecord.count >= maxAttempts) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetAt: currentRecord.resetAt };
  }
  
  // Increment count
  currentRecord.count++;
  return { allowed: true, remaining: maxAttempts - currentRecord.count, resetAt: currentRecord.resetAt };
}

export function resetRateLimit(identifier: string): void {
  attempts.delete(identifier);
}

// Cleanup old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of attempts.entries()) {
      if (now > value.resetAt) {
        attempts.delete(key);
      }
    }
  }, 300000);
}
