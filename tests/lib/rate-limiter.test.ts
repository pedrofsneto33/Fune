/**
 * @jest-environment node
 */

/**
 * Testes do rate-limiter (Fase 15b).
 * R1: o caso "KV usa config do chamador" PROVA o fix — assesta que
 * Ratelimit.slidingWindow recebeu (maxAttempts, `${windowMs} ms`) da chamada.
 * Contra o código antigo (slidingWindow(10,'60s') fixo) este teste FALHA.
 * Estados de fallback (R2): (a) KV ok usa KV, (b) sem env usa in-memory,
 * (c) Redis down cai em in-memory com fail-open + logError 1x.
 * Mock do módulo inteiro: `limit` na classe real é campo de instância
 * (não está no prototype), então o spy é no construtor mockado.
 */

const slidingWindowMock = jest.fn((tokens: number, duration: string) => ({ tokens, duration }));
const limitMock = jest.fn();

jest.mock('@upstash/ratelimit', () => ({
  __esModule: true,
  Ratelimit: Object.assign(
    jest.fn().mockImplementation(function (
      this: { limit: (id: string) => unknown },
      opts: Record<string, unknown>,
    ) {
      Object.assign(this, opts);
      this.limit = (id: string) => limitMock(id);
    }),
    { slidingWindow: slidingWindowMock },
  ),
}));

// kv mockado: nunca toca rede — o .limit() usado é o do mock acima.
jest.mock('@vercel/kv', () => ({ kv: {} }));

import { checkRateLimit } from '@/lib/rate-limiter';

const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('checkRateLimit (Fase 15b — config respeitado no Ratelimit de produção)', () => {
  beforeEach(() => {
    slidingWindowMock.mockClear();
    limitMock.mockReset();
    consoleSpy.mockClear();
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
  });

  it('(R1) com KV ativo, cria slidingWindow com o config do chamador (300/60000)', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://mock.upstash';
    limitMock.mockResolvedValueOnce({ success: true, remaining: 299, reset: Date.now() + 60000 });

    const rl = await checkRateLimit('api:1.2.3.4', { maxAttempts: 300, windowMs: 60000 });

    // PROVA DO FIX: a instância de produção recebeu o limite do chamador.
    // Código antigo chamava slidingWindow(10,'60s') fixo e falharia aqui.
    expect(slidingWindowMock).toHaveBeenCalledWith(300, '60000 ms');
    expect(limitMock).toHaveBeenCalledWith('api:1.2.3.4');
    expect(rl).toEqual({ allowed: true, remaining: 299, resetAt: expect.any(Number) });
  });

  it('(R1) config ausente usa o default 10/60000 (e não 10/60s do código antigo)', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://mock.upstash';
    limitMock.mockResolvedValueOnce({ success: true, remaining: 9, reset: Date.now() + 60000 });

    await checkRateLimit('sem-config:1');

    expect(slidingWindowMock).toHaveBeenCalledWith(10, '60000 ms');
  });

  it('(R2b) sem UPSTASH_REDIS_REST_URL usa in-memory respeitando maxAttempts', async () => {
    const p1 = await checkRateLimit('mem:1', { maxAttempts: 2, windowMs: 60000 });
    const p2 = await checkRateLimit('mem:1', { maxAttempts: 2, windowMs: 60000 });
    const p3 = await checkRateLimit('mem:1', { maxAttempts: 2, windowMs: 60000 });

    expect(p1.allowed).toBe(true);
    expect(p2.allowed).toBe(true);
    expect(p3.allowed).toBe(false);
    expect(p3.remaining).toBe(0);
    expect(p3.resetAt).toBeGreaterThan(Date.now());
    expect(slidingWindowMock).not.toHaveBeenCalled();
  });

  it('(R2b) config parcial mescla com default (maxAttempts custom, window 60000)', async () => {
    const p1 = await checkRateLimit('mem-default:1', { maxAttempts: 1 });
    const p2 = await checkRateLimit('mem-default:1', { maxAttempts: 1 });

    expect(p1.allowed).toBe(true);
    expect(p1.remaining).toBe(0);
    expect(p2.allowed).toBe(false);
  });

  it('(R2c) Redis down: fail-open — cai no in-memory, allowed:true e logError 1x', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://mock.upstash';
    limitMock.mockRejectedValueOnce(new Error('Redis down'));

    const rl = await checkRateLimit('down:1', { maxAttempts: 5, windowMs: 60000 });

    expect(rl.allowed).toBe(true);
    expect(rl.remaining).toBe(4);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it('(R2b) janela in-memory expira e volta a permitir', async () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(1_000_000);
      const p1 = await checkRateLimit('janela:1', { maxAttempts: 1, windowMs: 60000 });
      const p2 = await checkRateLimit('janela:1', { maxAttempts: 1, windowMs: 60000 });
      jest.setSystemTime(1_000_000 + 61_000);
      const p3 = await checkRateLimit('janela:1', { maxAttempts: 1, windowMs: 60000 });

      expect(p1.allowed).toBe(true);
      expect(p2.allowed).toBe(false);
      expect(p3.allowed).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});
