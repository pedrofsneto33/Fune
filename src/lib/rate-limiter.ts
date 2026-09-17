/**
 * Rate limiter — Vercel KV (Upstash Redis) com fallback in-memory.
 * F-22: in-memory perde contador em serverless cold start.
 * Fase 15b: instancia Ratelimit por config (maxAttempts/windowMs) — antes o
 * slidingWindow(10,'60s') fixo ignorava o config de cada chamador em producao.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { logError } from './http-error';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = { maxAttempts: 10, windowMs: 60000 };

// Uma instancia por combinacao max:windowMs (reuso entre requests; o prefixo
// por config isola os contadores no Redis entre limites diferentes)
const ratelimitCache = new Map<string, Ratelimit>();

function getRatelimit(config: RateLimitConfig): Ratelimit {
  const { maxAttempts, windowMs } = config;
  const key = `${maxAttempts}:${windowMs}`;
  let instance = ratelimitCache.get(key);
  if (!instance) {
    instance = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(maxAttempts, `${windowMs} ms`),
      prefix: `rl:${key}`,
      analytics: true,
    });
    ratelimitCache.set(key, instance);
  }
  return instance;
}

export async function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const full = { ...DEFAULT_CONFIG, ...config };

  // Em desenvolvimento/local, fallback in-memory (mesma env checada antes)
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return legacyCheckRateLimit(identifier, full);
  }

  try {
    const { success, reset, remaining } = await getRatelimit(full).limit(identifier);
    return {
      allowed: success,
      remaining: remaining ?? 0,
      resetAt: reset ?? Date.now() + full.windowMs,
    };
  } catch (err) {
    // Redis down (@vercel/kv lanca sem KV_REST_API_URL/TOKEN; Upstash pode
    // falhar): fail-open — loga e usa o in-memory local, nunca derruba a API.
    logError(err, 'rate-limiter');
    return legacyCheckRateLimit(identifier, full);
  }
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
