/** @jest-environment node */
import { POST } from '@/app/api/webhooks/asaas/route';
import { recordIncome } from '@/lib/financial';
import { generateCommission } from '@/lib/commissions';
import { logError } from '@/lib/http-error';
import { mockSupabaseAdmin, mockRateLimit, setupWebhookDb, makeAsaasRequest } from '../helpers/api-mocks';
jest.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/financial', () => ({ recordIncome: jest.fn() }));
jest.mock('@/lib/commissions', () => ({ generateCommission: jest.fn() }));
jest.mock('@/lib/http-error', () => ({ logError: jest.fn() }));
const mLog = logError as unknown as jest.Mock;
const mIncome = recordIncome as unknown as jest.Mock;
const mComm = generateCommission as unknown as jest.Mock;
const validBody = { event: 'PAYMENT_RECEIVED', payment: { id: 'pay_1', billingType: 'PIX', confirmedDate: '2026-09-01T00:00:00Z' } };
beforeEach(() => { mIncome.mockReset(); mComm.mockReset(); mComm.mockResolvedValue(undefined); mIncome.mockResolvedValue({ ok: true }); mLog.mockReset(); });
describe('webhook Asaas (Fase 7a)', () => {
  it('401 sem token', async () => {
    mockRateLimit(true);
    const res = await POST(makeAsaasRequest({ token: null, body: validBody }));
    expect(res.status).toBe(401);
    const j = await res.json();
    expect(j.error).toMatch(/ausente/);
  });
  it('403 token invalido', async () => {
    mockRateLimit(true);
    const mf = mockSupabaseAdmin();
    setupWebhookDb(mf, { tenant: null, tenantError: { message: 'x' } });
    const res = await POST(makeAsaasRequest({ body: validBody }));
    expect(res.status).toBe(403);
  });
  it('400 JSON invalido', async () => {
    mockRateLimit(true);
    const res = await POST(makeAsaasRequest({ rawBody: '{bad' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/JSON/);
  });
  it('400 sem payment.id', async () => {
    mockRateLimit(true);
    const res = await POST(makeAsaasRequest({ body: { event: 'PAYMENT_RECEIVED', payment: {} } }));
    expect(res.status).toBe(400);
  });
  it('200 PAYMENT_RECEIVED novo: paid + receita + comissao', async () => {
    mockRateLimit(true);
    const mf = mockSupabaseAdmin();
    setupWebhookDb(mf, { updated: [{ id: 'db-1', amount: 100, contract_id: 'c-1' }] });
    const res = await POST(makeAsaasRequest({ body: validBody }));
    expect(res.status).toBe(200);
    const tenantCallIndex = mf.mock.calls.findIndex(([table]) => table === 'tenants');
    const tenantChain = mf.mock.results[tenantCallIndex].value;
    expect(tenantChain.select).toHaveBeenCalledWith('id');
    expect(tenantChain.eq).toHaveBeenCalledWith(
      'asaas_webhook_token_hash',
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
    expect(mIncome).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1', amount: 100 }));
    expect(mComm).toHaveBeenCalled();
  });
  it('idempotente: evento ja processado nao reprocessa', async () => {
    mockRateLimit(true);
    const mf = mockSupabaseAdmin();
    setupWebhookDb(mf, { already: [{ id: 'e-1' }] });
    const res = await POST(makeAsaasRequest({ body: validBody }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(expect.objectContaining({ received: true }));
    expect(mIncome).not.toHaveBeenCalled();
    expect(mComm).not.toHaveBeenCalled();
  });
  it('11e: token curto (<16) bloqueia com 401 (enforcement)', async () => {
    mockRateLimit(true);
    const mf = mockSupabaseAdmin();
    setupWebhookDb(mf, { updated: [{ id: 'db-1', amount: 100, contract_id: 'c-1' }] });
    const res = await POST(makeAsaasRequest({ token: 'curto', body: validBody }));
    expect(res.status).toBe(401);
    expect(mLog).toHaveBeenCalledTimes(1);
    expect(mLog.mock.calls[0][1]).toMatch(/TOKEN FRACO/);
  });
  it('11e: token bem-formado inexistente cai no 403 do lookup (gate real)', async () => {
    mockRateLimit(true);
    const mf = mockSupabaseAdmin();
    setupWebhookDb(mf, { tenant: null, tenantError: { message: 'x' } });
    // >= 16 chars passa pelo check de tamanho (11e-1) e e barrado pelo lookup.
    const res = await POST(makeAsaasRequest({ token: 't'.repeat(49), body: validBody }));
    expect(res.status).toBe(403);
    expect(mLog).not.toHaveBeenCalledWith(expect.anything(), expect.stringMatching(/TOKEN FRACO/));
  });
});