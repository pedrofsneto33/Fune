/** @jest-environment node */
import { NextRequest } from 'next/server';
jest.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: jest.fn(), auth: { getUser: jest.fn() } } }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/http-error', () => ({ logError: jest.fn(), serverError: jest.fn((e: unknown) => { const { NextResponse } = jest.requireActual('next/server'); return NextResponse.json({ error: String((e as Error)?.message || e) }, { status: 500 }); }) }));
import { POST } from '@/app/api/billing/pix/route';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { mockSupabaseAdmin, mockRateLimit, mockAsaasFetch, makeChain } from '../helpers/api-mocks';
const asMock = (fn: unknown): jest.Mock => fn as unknown as jest.Mock;
const getUserMock = (): jest.Mock => asMock((supabaseAdmin as unknown as { auth: { getUser: unknown } }).auth.getUser);
const HOLDER_OK = { id: 'h-1', full_name: 'Ana', cpf: '529.982.247-25', phone: '11999990001', status: 'ativo' };
const PAY_OK = { id: 'pay-1', amount: 100, due_date: '2030-02-10', contracts: { id: 'c-1', status: 'active', holders: HOLDER_OK } };
const TENANT_OK = { asaas_api_key: 'test-key', asaas_wallet_id: null, asaas_environment: 'sandbox' };
function pixReq(body: unknown, auth = true): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (auth) headers.authorization = 'Bearer t';
  return new NextRequest('http://localhost/api/billing/pix', { method: 'POST', headers, body: JSON.stringify(body) });
}

interface PixDbOpts { role?: string; tenant?: unknown; payment?: unknown; paymentError?: { message: string } | null; updateError?: { message: string } | null; }
function setupPixDb(mockFrom: jest.Mock, o: PixDbOpts = {}): { updatePayloads: unknown[] } {
  const role = o.role ?? 'admin';
  const tenant = o.tenant === undefined ? TENANT_OK : o.tenant;
  const payment = o.payment === undefined ? PAY_OK : o.payment;
  const paymentError = o.paymentError ?? null;
  const updateError = o.updateError ?? null;
  const updatePayloads: unknown[] = [];
  const tenantChain = makeChain({ singleValue: { data: tenant, error: null } });
  const paymentChain = makeChain({ singleValue: { data: payment, error: paymentError } });
  mockFrom.mockImplementation((table: string) => {
    if (table === 'user_roles') return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { tenant_id: 'tenant-1', role }, error: null }) }) }) };
    if (table === 'tenants') return tenantChain;
    if (table === 'payments') return {
      select: jest.fn(() => paymentChain),
      update: jest.fn((p: unknown) => { updatePayloads.push(p); return makeChain({ thenValue: { data: null, error: updateError } }); }),
    };
    return makeChain({ thenValue: { data: null, error: null } });
  });
  return { updatePayloads };
}
const happyRules = () => [
  { method: 'GET', urlIncludes: '/customers?cpfCnpj=', body: { data: [{ id: 'cus-1' }] } },
  { method: 'POST', urlIncludes: '/payments', body: { id: 'pay_asaas_1', invoiceUrl: 'https://asaas.test/i/1' } },
  { method: 'GET', urlIncludes: '/pixQrCode', body: { payload: 'pix-code-123', encodedImage: 'img-b64', expirationDate: '2030-02-11' } },
];
beforeEach(() => { jest.restoreAllMocks(); getUserMock().mockReset().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }); mockRateLimit(true); });
describe('billing/pix (Fase 7d-1)', () => {
  it('1) 401 sem Authorization', async () => {
    mockSupabaseAdmin(); mockAsaasFetch([]);
    getUserMock().mockReset().mockResolvedValue({ data: { user: null }, error: { message: 'x' } });
    const res = await POST(pixReq({ payment_id: 'pay-1' }, false));
    expect(res.status).toBe(401);
  });
  it('2) 403 role sem permissao (seller)', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupPixDb(mf, { role: 'seller' });
    const res = await POST(pixReq({ payment_id: 'pay-1' }));
    expect(res.status).toBe(403);
  });
  it('3a) 400 sem payment_id', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupPixDb(mf);
    const res = await POST(pixReq({}));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/payment_id/);
  });
  it('3b) 400 CPF do holder invalido', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    const bad = { ...PAY_OK, contracts: { ...PAY_OK.contracts, holders: { ...HOLDER_OK, cpf: '123' } } };
    setupPixDb(mf, { payment: bad });
    const res = await POST(pixReq({ payment_id: 'pay-1' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/CPF/);
  });
  it('4) 404 pagamento nao existe / outro tenant', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupPixDb(mf, { payment: null, paymentError: { message: 'not found' } });
    const res = await POST(pixReq({ payment_id: 'pay-ghost' }));
    expect(res.status).toBe(404);
  });
  it('5) 403 elegibilidade: holder inativo e contrato cancelled', async () => {
    const mf1 = mockSupabaseAdmin(); mockAsaasFetch([]);
    const inactive = { ...PAY_OK, contracts: { ...PAY_OK.contracts, holders: { ...HOLDER_OK, status: 'inativo' } } };
    setupPixDb(mf1, { payment: inactive });
    const r1 = await POST(pixReq({ payment_id: 'pay-1' }));
    expect(r1.status).toBe(403);
    const mf2 = mockSupabaseAdmin(); mockAsaasFetch([]);
    const cancelled = { ...PAY_OK, contracts: { ...PAY_OK.contracts, status: 'cancelled' } };
    setupPixDb(mf2, { payment: cancelled });
    const r2 = await POST(pixReq({ payment_id: 'pay-1' }));
    expect(r2.status).toBe(403);
  });
  it('6a) 200 happy path vincula asaas_payment_id + pix', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch(happyRules());
    const { updatePayloads } = setupPixDb(mf);
    const res = await POST(pixReq({ payment_id: 'pay-1' }));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j).toEqual(expect.objectContaining({ success: true, payload: 'pix-code-123', encodedImage: 'img-b64' }));
    expect(j.expirationDate).toBeDefined();
    expect(updatePayloads).toHaveLength(1);
    expect(updatePayloads[0]).toEqual(expect.objectContaining({ asaas_payment_id: 'pay_asaas_1', pix_code: 'pix-code-123', pix_qr_code_url: 'img-b64' }));
  });
  it('6b) 400 erro Asaas no charge', async () => {
    const mf = mockSupabaseAdmin();
    mockAsaasFetch([
      { method: 'GET', urlIncludes: '/customers?cpfCnpj=', body: { data: [{ id: 'cus-1' }] } },
      { method: 'POST', urlIncludes: '/payments', body: { errors: [{ description: 'Saldo insuficiente' }] }, ok: false, status: 400 },
    ]);
    setupPixDb(mf);
    const res = await POST(pixReq({ payment_id: 'pay-1' }));
    expect(res.status).toBe(400);
  });
});


