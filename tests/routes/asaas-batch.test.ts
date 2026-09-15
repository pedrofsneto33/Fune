/** @jest-environment node */
import { NextRequest } from 'next/server';
jest.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: jest.fn(), auth: { getUser: jest.fn() } } }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/http-error', () => ({ logError: jest.fn(), serverError: jest.fn((e: unknown) => { const { NextResponse } = jest.requireActual('next/server'); return NextResponse.json({ error: String((e as Error)?.message || e) }, { status: 500 }); }) }));
import { POST } from '@/app/api/billing/asaas-batch/route';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { mockSupabaseAdmin, mockRateLimit, mockAsaasFetch, setupBatchDb } from '../helpers/api-mocks';
const asMock = (fn: unknown): jest.Mock => fn as unknown as jest.Mock;
function batchReq(body: unknown, withAuthHeader = true): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (withAuthHeader) headers.authorization = 'Bearer t';
  return new NextRequest('http://localhost/api/billing/asaas-batch', { method: 'POST', headers, body: JSON.stringify(body) });
}
const C1 = { id: 'c1', status: 'active', holders: { id: 'h1', full_name: 'Ana Silva', cpf: '529.982.247-25', phone: '11999990001', status: 'ativo' }, plans: { name: 'Familiar Ouro', monthly_fee: 100 } };
const C2 = { id: 'c2', status: 'active', holders: { id: 'h2', full_name: 'Bruno Souza', cpf: '145.382.067-20', phone: '11999990002', status: 'ativo' }, plans: { name: 'Familiar Ouro', monthly_fee: 150 } };
const C_INACTIVE_HOLDER = { id: 'c3', status: 'active', holders: { id: 'h3', full_name: 'Inativo X', cpf: '390.533.447-05', phone: '11999990003', status: 'inativo' }, plans: { name: 'Familiar Ouro', monthly_fee: 100 } };
const payRules = (ids: string[]) => {
  const rules: Array<{ method: string; urlIncludes: string; body: unknown }> = [];
  ids.forEach((pid, i) => {
    rules.push({ method: 'GET', urlIncludes: '/customers?cpfCnpj=', body: { data: [{ id: `cus-${i}` }] } });
    rules.push({ method: 'POST', urlIncludes: '/payments', body: { id: pid, value: 100 + i } });
  });
  return rules;
};
beforeEach(() => {
  jest.restoreAllMocks();
  asMock((supabaseAdmin as unknown as { auth: { getUser: unknown } }).auth.getUser).mockReset().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  mockRateLimit(true);
});
describe('billing/asaas-batch (Fase 7c)', () => {
  it('401 sem Authorization', async () => {
    mockSupabaseAdmin(); mockAsaasFetch([]);
    asMock((supabaseAdmin as unknown as { auth: { getUser: unknown } }).auth.getUser).mockReset().mockResolvedValue({ data: { user: null }, error: { message: 'x' } });
    const res = await POST(batchReq({ billingType: 'PIX' }, false));
    expect(res.status).toBe(401);
  });
  it('403 role attendant', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupBatchDb(mf, { contracts: [] }, 'attendant');
    const res = await POST(batchReq({ billingType: 'PIX' }));
    expect(res.status).toBe(403);
  });
  it('billingType invalido defaulteia BOLETO', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch(payRules(['pay-1']));
    const { upsertCalls } = setupBatchDb(mf, { contracts: [C1] });
    const res = await POST(batchReq({ billingType: 'XXX' }));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.billingType).toBe('BOLETO');
    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0][0]).toEqual(expect.objectContaining({ payment_method: 'boleto' }));
  });
  it('happy path 2 contratos -> created 2 + upsert 2x', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch(payRules(['pay-1', 'pay-2']));
    const { upsertCalls } = setupBatchDb(mf, { contracts: [C1, C2] });
    const res = await POST(batchReq({ billingType: 'PIX', dueDate: '2030-02-10' }));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.created).toBe(2);
    expect(upsertCalls).toHaveLength(2);
    expect(upsertCalls[0][1]).toEqual({ onConflict: 'asaas_payment_id' });
  });
  it('holder inativo e filtrado', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch(payRules(['pay-1']));
    const { upsertCalls } = setupBatchDb(mf, { contracts: [C_INACTIVE_HOLDER, C1] });
    const res = await POST(batchReq({ billingType: 'PIX' }));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.created).toBe(1);
    expect(upsertCalls).toHaveLength(1);
  });
  it('erro Asaas em 1 holder nao aborta o lote', async () => {
    const mf = mockSupabaseAdmin();
    mockAsaasFetch([
      { method: 'GET', urlIncludes: '/customers?cpfCnpj=', body: { data: [{ id: 'cus-0' }] } },
      { method: 'POST', urlIncludes: '/payments', body: { errors: [{ description: 'Saldo insuficiente' }] } },
      { method: 'GET', urlIncludes: '/customers?cpfCnpj=', body: { data: [{ id: 'cus-1' }] } },
      { method: 'POST', urlIncludes: '/payments', body: { id: 'pay-ok' } },
    ]);
    const { upsertCalls } = setupBatchDb(mf, { contracts: [C1, C2] });
    const res = await POST(batchReq({ billingType: 'PIX' }));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.created).toBe(1);
    expect(j.failed).toBe(1);
    expect(upsertCalls).toHaveLength(1);
    expect(j.results.find((r: { contract_id: string }) => r.contract_id === 'c1').status).toBe('error');
  });
});