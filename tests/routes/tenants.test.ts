/** @jest-environment node */
import { NextRequest } from 'next/server';
jest.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: jest.fn(), auth: { getUser: jest.fn() } } }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/http-error', () => ({ logError: jest.fn() }));
import { PATCH } from '@/app/api/tenants/route';
import { mockSupabaseAdmin, mockRateLimit, mockWithAuth, makeChain } from '../helpers/api-mocks';

const LONG_TOKEN = 't'.repeat(49);

function tenantReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/tenants', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: 'Bearer t' },
    body: JSON.stringify(body),
  });
}

// mockWithAuth cobre auth.getUser + user_roles; aqui so complementamos a tabela
// 'tenants' com o update().eq() awaitable que o PATCH usa.
function mockTenantsUpdate(mf: jest.Mock): { updates: unknown[] } {
  const updates: unknown[] = [];
  const base = mf.getMockImplementation() as (...args: unknown[]) => unknown;
  mf.mockImplementation((table: string, ...rest: unknown[]) => {
    if (table === 'tenants') {
      return {
        update: jest.fn((payload: unknown) => {
          updates.push(payload);
          return makeChain({ thenValue: { data: null, error: null } });
        }),
      };
    }
    return base(table, ...rest);
  });
  return { updates };
}

beforeEach(() => {
  jest.restoreAllMocks();
  mockRateLimit(true);
});

describe('PATCH /api/tenants — token de webhook (Fase 11e-2)', () => {
  it('1) 400 token de webhook curto (<16)', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('admin');
    const { updates } = mockTenantsUpdate(mf);
    const res = await PATCH(tenantReq({ asaas_webhook_token: 'curto' }));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toMatch(/16 caracteres/);
    // rejeitado antes de qualquer escrita
    expect(updates).toHaveLength(0);
  });

  it('2) 11e-3: token vazio limpa a coluna (grava null)', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('admin');
    const { updates } = mockTenantsUpdate(mf);
    const res = await PATCH(tenantReq({ asaas_webhook_token: '' }));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.success).toBe(true);
    // vazio agora LIMPA o token (grava null) em vez de ser no-op
    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual(expect.objectContaining({
      asaas_webhook_token_hash: null,
    }));
    expect(updates[0]).not.toHaveProperty('asaas_webhook_token');
  });

  it('3) 200 token longo (49 chars) eh persistido', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('admin');
    const { updates } = mockTenantsUpdate(mf);
    const res = await PATCH(tenantReq({ asaas_webhook_token: LONG_TOKEN }));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.success).toBe(true);
    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual(expect.objectContaining({
      asaas_webhook_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
    expect(updates[0]).not.toHaveProperty('asaas_webhook_token');
  });
});
