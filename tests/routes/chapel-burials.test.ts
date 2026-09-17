/** @jest-environment node */
import { NextRequest } from 'next/server';
jest.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: jest.fn(), auth: { getUser: jest.fn() } } }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/http-error', () => ({ logError: jest.fn() }));
import { POST, PATCH } from '@/app/api/chapel/burials/route';
import { mockSupabaseAdmin, mockRateLimit, mockWithAuth, makeChain } from '../helpers/api-mocks';

const VALID_ID = '123e4567-e89b-42d3-a456-426614174000';

function burialReq(method: string, body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/chapel/burials', {
    method,
    headers: { 'content-type': 'application/json', authorization: 'Bearer t' },
    body: JSON.stringify(body),
  });
}

// Captura payloads de insert/update na tabela chapel_burials,
// preservando o mock de user_roles instalado por mockWithAuth.
function mockBurials(mf: jest.Mock): { inserts: unknown[]; updates: unknown[] } {
  const inserts: unknown[] = [];
  const updates: unknown[] = [];
  const base = mf.getMockImplementation() as ((...args: unknown[]) => unknown) | undefined;
  mf.mockImplementation((table: string, ...rest: unknown[]) => {
    if (table === 'chapel_burials') {
      return {
        insert: jest.fn((payload: unknown) => {
          inserts.push(payload);
          return makeChain({ singleValue: { data: { id: 'b-1' }, error: null } });
        }),
        update: jest.fn((payload: unknown) => {
          updates.push(payload);
          return makeChain({ singleValue: { data: { id: VALID_ID }, error: null } });
        }),
      };
    }
    if (base) return base(table, ...rest);
    return makeChain({ thenValue: { data: null, error: null } });
  });
  return { inserts, updates };
}

beforeEach(() => {
  jest.restoreAllMocks();
  mockRateLimit(true);
});

describe('POST /api/chapel/burials — latitude/longitude (12d-2a)', () => {
  it('1) lat/lng validos -> 201 e persiste no insert', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('admin');
    const { inserts } = mockBurials(mf);
    const res = await POST(burialReq('POST', { deceased_name: 'Joao Silva', latitude: -23.55, longitude: -46.63 }));
    expect(res.status).toBe(201);
    expect(inserts).toHaveLength(1);
    expect((inserts[0] as unknown[])[0]).toEqual(expect.objectContaining({ latitude: -23.55, longitude: -46.63 }));
  });

  it('2) latitude fora do range (100) -> 400', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('admin');
    const { inserts } = mockBurials(mf);
    const res = await POST(burialReq('POST', { deceased_name: 'Joao Silva', latitude: 100, longitude: -46.63 }));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toMatch(/Latitude/);
    expect(inserts).toHaveLength(0);
  });

  it('3) longitude fora do range (200) -> 400', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('admin');
    const { inserts } = mockBurials(mf);
    const res = await POST(burialReq('POST', { deceased_name: 'Joao Silva', latitude: -23.55, longitude: 200 }));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toMatch(/Longitude/);
    expect(inserts).toHaveLength(0);
  });

  it('4) latitude nao-numerica ("abc") -> 400', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('admin');
    const { inserts } = mockBurials(mf);
    const res = await POST(burialReq('POST', { deceased_name: 'Joao Silva', latitude: 'abc' }));
    expect(res.status).toBe(400);
    expect(inserts).toHaveLength(0);
  });

  it('5) sem lat/lng -> 201, grava null sem quebrar', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('admin');
    const { inserts } = mockBurials(mf);
    const res = await POST(burialReq('POST', { deceased_name: 'Joao Silva' }));
    expect(res.status).toBe(201);
    expect(inserts).toHaveLength(1);
    expect((inserts[0] as unknown[])[0]).toEqual(expect.objectContaining({ latitude: null, longitude: null }));
  });
});

describe('PATCH /api/chapel/burials — latitude/longitude (12d-2a)', () => {
  it('6) PATCH com lat/lng -> 200 e atualiza', async () => {
    const mf = mockSupabaseAdmin();
    mockWithAuth('admin');
    const { updates } = mockBurials(mf);
    const res = await PATCH(burialReq('PATCH', { id: VALID_ID, latitude: -23.55, longitude: -46.63 }));
    expect(res.status).toBe(200);
    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual(expect.objectContaining({ latitude: -23.55, longitude: -46.63 }));
  });
});
