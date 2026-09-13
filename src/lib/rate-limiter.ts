/**
 * Rate limiter — Vercel KV (Upstash Redis) com fallback in-memory.
 * F-22: in-memory perde contador em serverless cold start.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// Instância única (reutilizada entre cold starts — KV mantém o estado)
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '60s'),
  analytics: true,
});

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export async function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // Em desenvolvimento/local, fallback in-memory
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return legacyCheckRateLimit(identifier, config);
  }

  const { success, reset, remaining } = await ratelimit.limit(identifier);

  return {
    allowed: success,
    remaining: remaining ?? 0,
    resetAt: reset ?? Date.now() + 60000,
  };
}

export function resetRateLimit(identifier: string): void {
  // KV: não deleta por key individual (sliding window). Em desenvolvimento:
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    attempts.delete(identifier);
  }
}

// --- Fallback in-memory (apenas desenvolvimento) ---
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const attempts = new Map<string, RateLimitEntry>();
const DEFAULT_CONFIG: RateLimitConfig = { maxAttempts: 10, windowMs: 60000 };

function legacyCheckRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const { maxAttempts, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  const record = attempts.get(identifier);
  if (record && now > record.resetAt) attempts.delete(identifier);

  const current = attempts.get(identifier);
  if (!current) {
    attempts.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
  }
  if (current.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }
  current.count++;
  return { allowed: true, remaining: maxAttempts - current.count, resetAt: current.resetAt };
}
