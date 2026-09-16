/** @jest-environment node */
import { NextRequest } from 'next/server';
jest.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: jest.fn(), auth: { getUser: jest.fn() } } }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/http-error', () => ({ logError: jest.fn(), serverError: jest.fn((e: unknown) => { const { NextResponse } = jest.requireActual('next/server'); return NextResponse.json({ error: String((e as Error)?.message || e) }, { status: 500 }); }) }));
jest.mock('@/lib/asaasClient', () => ({ getAsaasConfigForTenant: jest.fn() }));
import { POST } from '@/app/api/payments/pix/route';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAsaasConfigForTenant } from '@/lib/asaasClient';
import { mockSupabaseAdmin, mockRateLimit, mockAsaasFetch, makeChain } from '../helpers/api-mocks';
const asMock = (fn: unknown): jest.Mock => fn as unknown as jest.Mock;
const getUserMock = (): jest.Mock => asMock((supabaseAdmin as unknown as { auth: { getUser: unknown } }).auth.getUser);
const asaasConfigMock = (): jest.Mock => asMock(getAsaasConfigForTenant);
const VALID_CONTRACT = '12345678-1234-4321-8234-123456789abc';
const TENANT_CFG = { apiKey: 'test-key', baseUrl: 'https://sandbox.asaas.com/api/v3', walletId: null };
function payReq(body: unknown, auth = true): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (auth) headers.authorization = 'Bearer t';
    return new NextRequest('http://localhost/api/payments/pix', { method: 'POST', headers, body: JSON.stringify(body) });
}
interface PayDbOpts { role?: string; contractFound?: boolean; }
function setupPayDb(mockFrom: jest.Mock, o: PayDbOpts = {}): { paymentsUpdateCalls: unknown[] } {
  const role = o.role ?? 'admin';
  const paymentsUpdateCalls: unknown[] = [];
  mockFrom.mockImplementation((table: string) => {
    if (table === 'user_roles') return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { tenant_id: 'tenant-1', role }, error: null }) }) }) };
    if (table === 'contracts') return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(o.contractFound ? { data: { id: VALID_CONTRACT, status: 'active' }, error: null } : { data: null, error: null }) }) }) }) };
    if (table === 'tenants') return makeChain({ singleValue: { data: TENANT_CFG, error: null } });
    if (table === 'payments') {
      return { update: jest.fn((p: unknown) => { paymentsUpdateCalls.push(p); return makeChain({ thenValue: { data: null, error: null } }); }) };
    }
    return makeChain({ thenValue: { data: null, error: null } });
  });
  asaasConfigMock().mockReset().mockResolvedValue(TENANT_CFG);
  return { paymentsUpdateCalls };
}
beforeEach(() => { jest.restoreAllMocks(); getUserMock().mockReset().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }); mockRateLimit(true); asaasConfigMock().mockReset().mockResolvedValue(TENANT_CFG); });
describe('payments/pix (Fase 7d-2)', () => {
  it('1) 401 sem Authorization', async () => {
    mockSupabaseAdmin(); mockAsaasFetch([]);
    getUserMock().mockReset().mockResolvedValue({ data: { user: null }, error: { message: 'x' } });
    const res = await POST(payReq({ amount: 100, customerCpf: '52998224705' }, false));
    expect(res.status).toBe(401);
  });
  it('2) 429 rate-limit bloqueado', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]); mockRateLimit(false);
    setupPayDb(mf);
    const res = await POST(payReq({ amount: 100, customerCpf: '52998224705' }));
    expect(res.status).toBe(429);
  });
  it('3a) 400 amount <= 0', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]); setupPayDb(mf);
    const res = await POST(payReq({ amount: 0, customerCpf: '52998224705' }));
    expect(res.status).toBe(400);
  });
  it('3b) 400 customerCpf curto', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]); setupPayDb(mf);
    const res = await POST(payReq({ amount: 100, customerCpf: '123' }));
    expect(res.status).toBe(400);
  });
  it('3c) 400 contractId nao-UUID', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]); setupPayDb(mf);
    const res = await POST(payReq({ amount: 100, customerCpf: '52998224705', contractId: 'nao-uuid' }));
    expect(res.status).toBe(400);
  });
  it('4) 404 contrato de outro tenant', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupPayDb(mf, { contractFound: false });
    const res = await POST(payReq({ amount: 100, customerCpf: '52998224705', contractId: VALID_CONTRACT }));
    expect(res.status).toBe(404);
  });
  it('5) 200 happy path: cobranca avulsa, sem DB write, mobilePhone no create-customer', async () => {
    const mf = mockSupabaseAdmin();
                    const createBodies: unknown[] = [];
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (input: unknown, init?: any) => {
      const url = String(input);
      const method = String(init?.method || 'GET').toUpperCase();
      if (method === 'GET' && url.includes('/customers?cpfCnpj=')) return { ok: true, status: 200, json: async () => ({ data: [] }) } as unknown as Response;
      if (method === 'POST' && url.includes('/customers')) {
        if (init?.body) createBodies.push(JSON.parse(init.body));
        return { ok: true, status: 200, json: async () => ({ id: 'cus-1' }) } as unknown as Response;
      }
      if (method === 'POST' && url.includes('/payments')) return { ok: true, status: 200, json: async () => ({ id: 'pay_asaas_1', netValue: 97.0 }) } as unknown as Response;
      if (method === 'GET' && url.includes('/pixQrCode')) return { ok: true, status: 200, json: async () => ({ payload: 'pix-payload-456', encodedImage: 'img-b647', expirationDate: '2030-02-12' }) } as unknown as Response;
      return { ok: false, status: 400, json: async () => ({}) } as unknown as Response;
    });
    const { paymentsUpdateCalls } = setupPayDb(mf);
    const res = await POST(payReq({ amount: 100, customerCpf: '52998224705', customerName: 'Fulano', customerPhone: '11999990001' }));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j).toEqual(expect.objectContaining({ success: true, paymentId: 'pay_asaas_1', payload: 'pix-payload-456', encodedImage: 'img-b647' }));
    expect(createBodies).toHaveLength(1);
    expect(createBodies[0]).toEqual(expect.objectContaining({ name: 'Fulano', cpfCnpj: '52998224705', mobilePhone: '11999990001' }));
    expect(paymentsUpdateCalls).toHaveLength(0);
  });
});


