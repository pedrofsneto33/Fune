/** @jest-environment node */
import { NextRequest } from 'next/server';
jest.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: jest.fn(), auth: { getUser: jest.fn(), admin: { getUserById: jest.fn() } } },
}));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/http-error', () => ({ logError: jest.fn(), serverError: jest.fn((e: unknown) => { const { NextResponse } = jest.requireActual('next/server'); return NextResponse.json({ error: String((e as Error)?.message || e) }, { status: 500 }); }) }));
import { POST as subscribePOST } from '@/app/api/saas/subscribe/route';
import { POST as cancelPOST } from '@/app/api/saas/cancel/route';
import { GET as subGET } from '@/app/api/saas/subscription/route';
import { GET as saasTenantsGET } from '@/app/api/saas/tenants/route';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { mockSupabaseAdmin, mockRateLimit } from '../helpers/api-mocks';

const asMock = (fn: unknown): jest.Mock => fn as unknown as jest.Mock;
const TENANT = '11111111-1111-1111-1111-111111111111';

function req(url: string, method: string, body?: unknown): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json', authorization: 'Bearer t' };
  return new NextRequest(`http://localhost${url}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

interface SubRow { id?: string; tenant_id?: string; asaas_subscription_id?: string; plan?: string; status?: string; valor?: number; next_due_date?: string; grace_until?: string; }

function setupDb(role = 'superadmin', sub: SubRow | null = null) {
  const mf = mockSupabaseAdmin();
  asMock((supabaseAdmin as unknown as { auth: { getUser: unknown } }).auth.getUser).mockReset()
    .mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  asMock((supabaseAdmin as unknown as { auth: { admin: { getUserById: unknown } } }).auth.admin.getUserById)
    .mockResolvedValue({ data: { user: { email: 'owner@x.com' } }, error: null });
  mf.mockImplementation((table: string) => {
    if (table === 'user_roles') {
      return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { tenant_id: TENANT, role }, error: null }), in: () => ({ limit: () => ({ maybeSingle: () => Promise.resolve({ data: { user_id: 'user-1', role }, error: null }) }) }) }) }) };
    }
    if (table === 'tenants') {
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: TENANT, name: 'Funeraria Saad', cnpj: '12345678000199' }, error: null }) }) }) };
    }
    if (table === 'saas_subscriptions') {
      const insertMock = jest.fn(() => Object.assign(Promise.resolve({ data: null, error: null }), { select: () => ({ single: () => Promise.resolve({ data: { id: 'sub-row-1' }, error: null }) }) }));
      const chain = {
        select: () => ({ eq: () => ({ neq: () => ({ order: () => ({ limit: () => ({ maybeSingle: () => Promise.resolve(sub ? { data: sub, error: null } : { data: null, error: null }) }) }), maybeSingle: () => Promise.resolve(sub ? { data: sub, error: null } : { data: null, error: null }) }) }) }),
        insert: insertMock,
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnThis(), then: undefined }),
      };
      return chain;
    }
    return {};
  });
  return mf;
}

describe('saas billing (Fase 2)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockRateLimit(true);
  });

  it('subscribe 403 sem superadmin', async () => {
    setupDb('admin');
    const res = await subscribePOST(req('/api/saas/subscribe', 'POST', { tenantId: TENANT, plan: 'essencial', valor: 397 }));
    expect(res.status).toBe(403);
  });
  it('subscribe 400 com plan invalido', async () => {
    setupDb('superadmin');
    const res = await subscribePOST(req('/api/saas/subscribe', 'POST', { tenantId: TENANT, plan: 'gold', valor: 397 }));
    expect(res.status).toBe(400);
  });
  it('subscribe 400 com valor <= 0', async () => {
    setupDb('superadmin');
    const res = await subscribePOST(req('/api/saas/subscribe', 'POST', { tenantId: TENANT, plan: 'essencial', valor: 0 }));
    expect(res.status).toBe(400);
  });
  it('subscribe 201 happy path', async () => {
    setupDb('superadmin');
    const spy = jest.spyOn(globalThis, 'fetch');
    spy.mockImplementation(async (input: unknown, init?: { method?: string }) => {
      const url = String(input);
      const method = String(init?.method || 'GET').toUpperCase();
      if (method === 'GET' && url.includes('/customers?cpfCnpj=')) {
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      }
      if (method === 'POST' && url.includes('/customers')) {
        return new Response(JSON.stringify({ id: 'cus-saas-1' }), { status: 200 });
      }
      if (method === 'POST' && url.includes('/subscriptions')) {
        return new Response(JSON.stringify({ id: 'sub-asaas-1' }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });
    const res = await subscribePOST(req('/api/saas/subscribe', 'POST', { tenantId: TENANT, plan: 'essencial', valor: 397 }));
    const j = await res.json();
    expect(res.status).toBe(201);
    expect(j.subscription_id).toBe('sub-asaas-1');
  });
  it('cancel 404 sem assinatura ativa', async () => {
    setupDb('superadmin', null);
    const res = await cancelPOST(req('/api/saas/cancel', 'POST', { tenantId: TENANT }));
    expect(res.status).toBe(404);
  });
  it('cancel 200 happy path', async () => {
    setupDb('superadmin', { id: 'row-1', asaas_subscription_id: 'sub-asaas-1' });
    const spy = jest.spyOn(globalThis, 'fetch');
    spy.mockImplementation(async () => new Response('{}', { status: 200 }));
    const res = await cancelPOST(req('/api/saas/cancel', 'POST', { tenantId: TENANT }));
    expect(res.status).toBe(200);
  });
  it('GET subscription 200 com dados', async () => {
    setupDb('admin', { plan: 'essencial', status: 'active', valor: 397, next_due_date: '2026-10-18', grace_until: '2026-10-25' });
    const res = await subGET(req(`/api/saas/subscription?tenantId=${TENANT}`, 'GET'));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.subscription.plan).toBe('essencial');
    expect(j.subscription).not.toHaveProperty('asaas_subscription_id');
  });
});

// ============================================================
// Fase 4a — painel admin SaaS: GET /api/saas/tenants
// ============================================================

interface TenantRow { id: string; name: string; cnpj: string; commercial_plan: string; status: string; }

const T_ACTIVE = '22222222-2222-2222-2222-222222222222';
const T_PAST_DUE = '33333333-3333-3333-3333-333333333333';
const T_NO_SUB = '44444444-4444-4444-4444-444444444444';

function setupTenantsDb(role = 'superadmin', tenants: TenantRow[] = [], subs: SubRow[] = []) {
  const mf = mockSupabaseAdmin();
  asMock((supabaseAdmin as unknown as { auth: { getUser: unknown } }).auth.getUser).mockReset()
    .mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  mf.mockImplementation((table: string) => {
    if (table === 'user_roles') {
      return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { tenant_id: TENANT, role }, error: null }) }) }) };
    }
    if (table === 'tenants') {
      return { select: () => ({ order: () => Promise.resolve({ data: tenants, error: null }) }) };
    }
    if (table === 'saas_subscriptions') {
      return { select: () => ({ neq: () => Promise.resolve({ data: subs, error: null }) }) };
    }
    return {};
  });
  return mf;
}

const TENANTS_3: TenantRow[] = [
  { id: T_ACTIVE, name: 'Funeraria A', cnpj: '11111111000111', commercial_plan: 'essencial', status: 'active' },
  { id: T_PAST_DUE, name: 'Funeraria B', cnpj: '22222222000122', commercial_plan: 'profissional', status: 'active' },
  { id: T_NO_SUB, name: 'Funeraria C', cnpj: '33333333000133', commercial_plan: 'essencial', status: 'active' },
];

const SUBS_2: SubRow[] = [
  { tenant_id: T_ACTIVE, plan: 'essencial', status: 'active', valor: 397, next_due_date: '2026-10-18', grace_until: '2026-10-25' },
  { tenant_id: T_PAST_DUE, plan: 'profissional', status: 'past_due', valor: 697.5, next_due_date: '2026-09-10', grace_until: '2026-09-17' },
];

describe('saas admin (Fase 4a) — GET /api/saas/tenants', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockRateLimit(true);
  });

  it('403 sem superadmin', async () => {
    setupTenantsDb('admin', TENANTS_3, SUBS_2);
    const res = await saasTenantsGET(req('/api/saas/tenants', 'GET'));
    expect(res.status).toBe(403);
  });

  it('200 lista 3 tenants com KPIs de MRR e inadimplencia', async () => {
    setupTenantsDb('superadmin', TENANTS_3, SUBS_2);
    const res = await saasTenantsGET(req('/api/saas/tenants', 'GET'));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.success).toBe(true);
    expect(j.tenants).toHaveLength(3);
    expect(j.kpis.total_tenants).toBe(3);
    expect(j.kpis.mrr_total).toBe(1094.5);
    expect(j.kpis.ativos).toBe(1);
    expect(j.kpis.inadimplentes).toBe(1);
  });

  it('tenant sem assinatura retorna subscription null', async () => {
    setupTenantsDb('superadmin', TENANTS_3, SUBS_2);
    const res = await saasTenantsGET(req('/api/saas/tenants', 'GET'));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.tenants[2].subscription).toBeNull();
    expect(j.tenants[0].subscription.status).toBe('active');
  });
});

