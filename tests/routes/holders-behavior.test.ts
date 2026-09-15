/** @jest-environment node */
import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from '@/app/api/holders/route';
import { mockSupabaseAdmin, mockRateLimit, mockWithAuth, makeChain } from '../helpers/api-mocks';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
jest.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: jest.fn(), auth: { getUser: jest.fn() } } }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/http-error', () => ({ logError: jest.fn() }));
const mockFrom = supabaseAdmin.from as unknown as jest.Mock;
const PLAN = '22222222-2222-4222-8222-222222222222';
const CPF = '529.982.247-25';
function req(method: string, url: string, body?: unknown): NextRequest {
  return new NextRequest(url, { method, headers: { authorization: 'Bearer t', 'content-type': 'application/json' }, body: body !== undefined ? JSON.stringify(body) : undefined });
}
function arrange(tables: (t: string) => unknown) {
  mockSupabaseAdmin(); mockRateLimit(true);
  mockFrom.mockImplementation((t: string) => tables(t));
  mockWithAuth('admin', 'tenant-1');
}
function postBase() { return { full_name: 'Fulano da Silva', cpf: CPF, phone: '(11) 99999-9999', plan_id: PLAN }; }
describe('holders behavior p1', () => {
  it('a) GET filtra por tenant_id', async () => {
    const seen: Array<[string, string, string]> = [];
    arrange(() => {
      const ch = makeChain({ thenValue: { data: [{ id: 'h1' }], error: null, count: 1 } });
      (ch.eq as jest.Mock).mockImplementation((k: string, v: string) => { seen.push(['holders', k, v]); return ch; });
      return ch;
    });
    const res = await GET(req('GET', 'http://localhost/api/holders'));
    expect(res.status).toBe(200);
    expect(seen).toContainEqual(['holders', 'tenant_id', 'tenant-1']);
  });
  it('b) POST 400 sem plan_id', async () => {
    arrange(() => makeChain({}));
    const res = await POST(req('POST', 'http://localhost/api/holders', { full_name: 'Fulano da Silva' }));
    expect(res.status).toBe(400);
  });
  it('c) POST 400 nome curto', async () => {
    arrange(() => makeChain({}));
    const res = await POST(req('POST', 'http://localhost/api/holders', { ...postBase(), full_name: 'A' }));
    expect(res.status).toBe(400);
  });
});
describe('holders behavior p2', () => {
  it('d) POST 201 holder + contract', async () => {
    let insertedContract: unknown = null;
    arrange((table) => {
      if (table === 'tenants') return makeChain({ singleValue: { data: { commercial_plan: 'essencial' }, error: null } });
      if (table === 'holders') {
        return {
          select: (...a: unknown[]) => {
            if (a.length === 2 || (a[1] as Record<string, unknown>)?.count) {
              return { eq: jest.fn().mockResolvedValue({ count: 0, error: null }) };
            }
            return { insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 'h-new' }, error: null }) }) }) };
          },
          insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 'h-new' }, error: null }) }) }),
        };
      }
      if (table === 'plans') return makeChain({ singleValue: { data: { id: PLAN }, error: null } });
      if (table === 'contracts') return { insert: jest.fn((rows: unknown) => { insertedContract = rows; return Promise.resolve({ error: null }); }) };
      return makeChain({});
    });
    const res = await POST(req('POST', 'http://localhost/api/holders', postBase()));
    expect(res.status).toBe(201);
    expect(insertedContract).toEqual([{ tenant_id: 'tenant-1', holder_id: 'h-new', plan_id: PLAN, status: 'active', start_date: expect.any(String), seller_name: null }]);
  });
});
describe('holders behavior p3', () => {
  it('e) PATCH atualiza full_name', async () => {
    let payload: unknown = null;
    arrange((table) => {
      if (table === 'holders') {
        return { update: jest.fn((p: unknown) => { payload = p; return { eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'h1', full_name: 'Novo Nome' }, error: null }) }; }) };
      }
      if (table === 'contracts') return makeChain({ singleValue: { data: null, error: null } });
      return makeChain({});
    });
    const res = await PATCH(req('PATCH', 'http://localhost/api/holders', { id: '33333333-3333-4333-8333-333333333333', full_name: 'Novo Nome' }));
    expect(res.status).toBe(200);
    expect(payload).toEqual({ full_name: 'Novo Nome' });
  });
  it('f) PATCH sincroniza plan_id no contract ativo', async () => {
    const cupd: unknown[] = [];
    arrange((table) => {
      if (table === 'holders') {
        return { update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'h1' }, error: null }) }) };
      }
      if (table === 'contracts') {
        return {
          select: jest.fn((cols: string) => (String(cols).includes('id, plan_id')
            ? { eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'c-1', plan_id: '11111111-1111-4111-8111-111111111111' }, error: null }) }
            : makeChain({}))),
          update: jest.fn((p: unknown) => { cupd.push(p); return { eq: jest.fn().mockReturnThis() }; }),
        };
      }
      if (table === 'plans') return makeChain({ singleValue: { data: { id: PLAN }, error: null } });
      return makeChain({});
    });
    const res = await PATCH(req('PATCH', 'http://localhost/api/holders', { id: '33333333-3333-4333-8333-333333333333', full_name: 'Fulano da Silva', plan_id: PLAN }));
    expect(res.status).toBe(200);
    expect(cupd).toContainEqual({ plan_id: PLAN });
  });
});
