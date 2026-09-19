/** @jest-environment node */
import { NextRequest } from 'next/server';
jest.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: jest.fn(), auth: { getUser: jest.fn() } } }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/http-error', () => ({ logError: jest.fn() }));
import { POST, PATCH } from '@/app/api/leads/route';
import { mockSupabaseAdmin, mockRateLimit, mockWithAuth, makeChain } from '../helpers/api-mocks';

const LEAD_ID = '11111111-1111-4111-8111-111111111111';

function postReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer t' },
    body: JSON.stringify(body),
  });
}

function patchReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/leads', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: 'Bearer t' },
    body: JSON.stringify(body),
  });
}

// Complementa a tabela 'leads' com insert/update awaitable (mockWithAuth cobre user_roles)
function mockLeadsTable(mf: jest.Mock): { inserted: unknown[]; updated: unknown[] } {
  const inserted: unknown[] = [];
  const updated: unknown[] = [];
  const base = mf.getMockImplementation() as (...args: unknown[]) => unknown;
  mf.mockImplementation((table: string, ...rest: unknown[]) => {
    if (table === 'leads') {
      return {
        insert: jest.fn((payload: unknown) => {
          inserted.push(payload);
          return makeChain({ singleValue: { data: { id: LEAD_ID }, error: null } });
        }),
        update: jest.fn((payload: unknown) => {
          updated.push(payload);
          return makeChain({ singleValue: { data: { id: LEAD_ID }, error: null } });
        }),
      };
    }
    return base(table, ...rest);
  });
  return { inserted, updated };
}

beforeEach(() => {
  jest.restoreAllMocks();
  mockRateLimit(true);
});

describe('POST /api/leads — campos dedicados (B-2)', () => {
  it('1) 201 com rating/reviews_count/address/website persistidos', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('superadmin');
    const { inserted } = mockLeadsTable(mf);
    const res = await POST(postReq({
      name: 'Funerária Lótus',
      rating: 4.8,
      reviews_count: 143,
      address: 'Av. Miguel Rosa, 3651',
      website: 'http://funerarialotus.com.br/',
    }));
    expect(res.status).toBe(201);
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toEqual(expect.objectContaining({
      rating: 4.8,
      reviews_count: 143,
      address: 'Av. Miguel Rosa, 3651',
      website: 'http://funerarialotus.com.br/',
    }));
  });

  it('2) 400 rating acima de 5', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('superadmin');
    const { inserted } = mockLeadsTable(mf);
    const res = await POST(postReq({ name: 'Fora do range', rating: 6 }));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toMatch(/Rating inválido/);
    expect(inserted).toHaveLength(0);
  });

  it('3) 400 rating negativo', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('superadmin');
    const { inserted } = mockLeadsTable(mf);
    const res = await POST(postReq({ name: 'Negativo', rating: -1 }));
    expect(res.status).toBe(400);
    expect(inserted).toHaveLength(0);
  });

  it('4) website javascript: e descartado (grava null)', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('superadmin');
    const { inserted } = mockLeadsTable(mf);
    const res = await POST(postReq({
      name: 'Site malicioso',
      website: 'javascript:alert(1)',
    }));
    expect(res.status).toBe(201);
    expect(inserted[0]).toEqual(expect.objectContaining({ website: null }));
  });
});

describe('PATCH /api/leads — campos dedicados (B-2)', () => {
  it('5) 200 atualiza rating', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('superadmin');
    const { updated } = mockLeadsTable(mf);
    const res = await PATCH(patchReq({ id: LEAD_ID, rating: 4.5 }));
    expect(res.status).toBe(200);
    expect(updated).toHaveLength(1);
    expect(updated[0]).toEqual(expect.objectContaining({ rating: 4.5 }));
  });
});
