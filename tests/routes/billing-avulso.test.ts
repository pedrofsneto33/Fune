/** @jest-environment node */
import { NextRequest } from 'next/server';
jest.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: jest.fn(), auth: { getUser: jest.fn() } } }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/http-error', () => ({ logError: jest.fn(), serverError: jest.fn((e: unknown) => { const { NextResponse } = jest.requireActual('next/server'); return NextResponse.json({ error: String((e as Error)?.message || e) }, { status: 500 }); }) }));
jest.mock('@/lib/financial', () => ({ recordIncome: jest.fn() }));
import { POST } from '@/app/api/billing/avulso/route';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rate-limiter';
import { recordIncome } from '@/lib/financial';
import { mockSupabaseAdmin, mockRateLimit, mockAsaasFetch, makeChain } from '../helpers/api-mocks';
const asMock = (fn: unknown): jest.Mock => fn as unknown as jest.Mock;
const getUserMock = (): jest.Mock => asMock((supabaseAdmin as unknown as { auth: { getUser: unknown } }).auth.getUser);
const TENANT_OK = { asaas_api_key: 'test-key', asaas_wallet_id: null, asaas_environment: 'sandbox' };
const SO_ID = '11111111-1111-4111-8111-111111111111';
const BODY_OK = {
  responsavel_nome: 'Maria Souza',
  responsavel_cpf: '529.982.247-25',
  responsavel_phone: '86999990000',
  descricao: 'Funeral avulso',
  valor: 150.5,
  vencimento: '2030-02-10',
  billingType: 'BOLETO',
};
function avulsoReq(body: unknown, auth = true): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (auth) headers.authorization = 'Bearer t';
  return new NextRequest('http://localhost/api/billing/avulso', { method: 'POST', headers, body: JSON.stringify(body) });
}

interface AvulsoDbOpts { role?: string; tenant?: unknown; soFound?: boolean; }
function setupAvulsoDb(mockFrom: jest.Mock, o: AvulsoDbOpts = {}): void {
  const role = o.role ?? 'admin';
  const tenant = o.tenant === undefined ? TENANT_OK : o.tenant;
  const so = o.soFound === false ? null : { id: SO_ID };
  mockFrom.mockImplementation((table: string) => {
    if (table === 'user_roles') return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { tenant_id: 'tenant-1', role }, error: null }) }) }) };
    if (table === 'tenants') return makeChain({ singleValue: { data: tenant, error: null } });
    if (table === 'service_orders') return makeChain({ singleValue: { data: so, error: null } });
    return makeChain({ thenValue: { data: null, error: null } });
  });
}

const boletoRules = () => [
  { method: 'GET', urlIncludes: '/customers?cpfCnpj=', body: { data: [{ id: 'cus-1' }] } },
  { method: 'POST', urlIncludes: '/payments', body: { id: 'pay_asaas_1', status: 'PENDING', bankSlipUrl: 'https://asaas.test/b/1', invoiceUrl: 'https://asaas.test/i/1' } },
];
const pixRules = () => [
  ...boletoRules(),
  { method: 'GET', urlIncludes: '/pixQrCode', body: { payload: 'pix-code-abc', encodedImage: 'img-b64' } },
];

beforeEach(() => {
  jest.restoreAllMocks();
  getUserMock().mockReset().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  mockRateLimit(true);
  asMock(recordIncome).mockReset().mockResolvedValue({ ok: true });
});

describe('billing/avulso (Fase 15)', () => {
  it('15-avulso: 1) 401 sem Authorization', async () => {
    mockSupabaseAdmin(); mockAsaasFetch([]);
    getUserMock().mockReset().mockResolvedValue({ data: { user: null }, error: { message: 'x' } });
    const res = await POST(avulsoReq(BODY_OK, false));
    expect(res.status).toBe(401);
  });

  it('15-avulso: 2) 403 role sem permissao (seller)', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupAvulsoDb(mf, { role: 'seller' });
    const res = await POST(avulsoReq(BODY_OK));
    expect(res.status).toBe(403);
  });

  it('15-avulso: 3) 429 rate limit por usuario (avulso:<userId>)', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupAvulsoDb(mf);
    // withAuth tambem chama checkRateLimit(`api:<ip>`) — nega SO a chave da rota
    asMock(checkRateLimit).mockImplementation((key: string) =>
      Promise.resolve({ allowed: !String(key).startsWith('avulso:'), remaining: 0, resetAt: Date.now() + 60000 }),
    );
    const res = await POST(avulsoReq(BODY_OK));
    expect(res.status).toBe(429);
    expect(asMock(checkRateLimit).mock.calls.map((c) => c[0])).toContain('avulso:user-1');
    expect((await res.json()).error).toMatch(/Muitas cobranças em sequência/);
  });

  it('15-avulso: 4) 400 sem nome/CPF do responsavel', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupAvulsoDb(mf);
    const res = await POST(avulsoReq({ valor: 100 }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Nome e CPF/);
  });

  it('15-avulso: 5) 400 CPF do responsavel invalido', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupAvulsoDb(mf);
    const res = await POST(avulsoReq({ ...BODY_OK, responsavel_cpf: '123' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/CPF do responsável inválido/);
  });

  it('15-avulso: 6) 400 valor invalido (zero ou ausente)', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupAvulsoDb(mf);
    const res = await POST(avulsoReq({ ...BODY_OK, valor: 0 }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Valor inválido/);
  });

  it('15-avulso: 7) 400 forma de pagamento invalida', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupAvulsoDb(mf);
    const res = await POST(avulsoReq({ ...BODY_OK, billingType: 'CARTAO' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Forma de pagamento inválida/);
  });

  it('15-avulso: 8) 400 service_order_id nao-UUID', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupAvulsoDb(mf);
    const res = await POST(avulsoReq({ ...BODY_OK, service_order_id: 'os-123' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Ordem de serviço inválida/);
  });

  it('15-avulso: 9) 404 service_order_id de outro tenant', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupAvulsoDb(mf, { soFound: false });
    const res = await POST(avulsoReq({ ...BODY_OK, service_order_id: SO_ID }));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/não encontrada para esta unidade/);
  });

  it('15-avulso: 10) 400 tenant sem asaas_api_key', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch([]);
    setupAvulsoDb(mf, { tenant: { asaas_api_key: null, asaas_wallet_id: null, asaas_environment: 'sandbox' } });
    const prev = process.env.ASAAS_API_KEY;
    process.env.ASAAS_API_KEY = '';
    try {
      const res = await POST(avulsoReq(BODY_OK));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/Asaas não configurada/);
    } finally {
      process.env.ASAAS_API_KEY = prev;
    }
  });

  it('15-avulso: 11) 201 happy path BOLETO + recordIncome com source billing_avulso', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch(boletoRules());
    setupAvulsoDb(mf);
    const res = await POST(avulsoReq(BODY_OK));
    const j = await res.json();
    expect(res.status).toBe(201);
    expect(j).toEqual(expect.objectContaining({
      success: true,
      message: 'Cobrança avulsa gerada com sucesso.',
      warning: null,
      payment_id: 'pay_asaas_1',
      invoiceUrl: 'https://asaas.test/b/1',
      status: 'PENDING',
      billingType: 'BOLETO',
      value: 150.5,
      dueDate: '2030-02-10',
      pix_qr_code: null,
    }));
    expect(asMock(recordIncome)).toHaveBeenCalledTimes(1);
    expect(asMock(recordIncome).mock.calls[0][0]).toEqual(expect.objectContaining({
      tenantId: 'tenant-1',
      amount: 150.5,
      category: 'Serviço Funeral Avulso',
      source: 'billing_avulso',
      serviceOrderId: null,
    }));
  });

  it('15-avulso: 12) 201 happy path PIX devolve QR code', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch(pixRules());
    setupAvulsoDb(mf);
    const res = await POST(avulsoReq({ ...BODY_OK, billingType: 'PIX' }));
    const j = await res.json();
    expect(res.status).toBe(201);
    expect(j).toEqual(expect.objectContaining({ billingType: 'PIX', pix_qr_code: 'pix-code-abc', pix_qr_image: 'img-b64' }));
  });

  it('15-avulso: 13) 201 com warning quando recordIncome falha (cobranca ja existe)', async () => {
    const mf = mockSupabaseAdmin(); mockAsaasFetch(boletoRules());
    setupAvulsoDb(mf);
    asMock(recordIncome).mockResolvedValue({ ok: false, error: 'db down' });
    const res = await POST(avulsoReq(BODY_OK));
    const j = await res.json();
    expect(res.status).toBe(201);
    expect(j.success).toBe(true);
    expect(j.warning).toMatch(/Livro Caixa/);
  });

  it('15-avulso: 14) 400 quando Asaas recusa a criacao da cobranca (sem receita)', async () => {
    const mf = mockSupabaseAdmin();
    mockAsaasFetch([
      { method: 'GET', urlIncludes: '/customers?cpfCnpj=', body: { data: [{ id: 'cus-1' }] } },
      { method: 'POST', urlIncludes: '/payments', body: { errors: [{ description: 'Saldo insuficiente' }] }, ok: false, status: 400 },
    ]);
    setupAvulsoDb(mf);
    const res = await POST(avulsoReq(BODY_OK));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Falha ao gerar cobrança no Asaas/);
    expect(asMock(recordIncome)).not.toHaveBeenCalled();
  });
});
