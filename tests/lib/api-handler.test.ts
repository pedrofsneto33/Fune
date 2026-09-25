/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';
jest.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: jest.fn(), auth: { getUser: jest.fn() } },
}));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/http-error', () => ({ logError: jest.fn() }));
import { withAuth } from '@/lib/api-handler';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rate-limiter';

const asMock = (fn: unknown): jest.Mock => fn as unknown as jest.Mock;
const DAY = 86400000;
const past10d = new Date(Date.now() - 10 * DAY).toISOString().slice(0, 10);

function req(method = 'GET', token: string | null = 'Bearer t'): NextRequest {
  const headers: Record<string, string> = {};
  if (token !== null) headers['authorization'] = token;
  return new NextRequest('http://localhost/api/x', { method, headers });
}

interface RoleRec { tenant_id: string | null; role: string; is_global?: boolean }
function setup(opts: {
  user?: { id: string } | null;
  authError?: { message: string } | null;
  role?: RoleRec | null;
  roleError?: { message: string } | null;
  subs?: Array<{ status: string; next_due_date: string | null; trial_ends_at: string | null }>;
}) {
  asMock(checkRateLimit).mockReset().mockResolvedValue({ allowed: true, remaining: 59, resetAt: Date.now() + 60000 });
  asMock((supabaseAdmin as unknown as { auth: { getUser: unknown } }).auth.getUser)
    .mockReset()
    .mockResolvedValue({ data: { user: opts.user === undefined ? { id: 'user-1' } : opts.user }, error: opts.authError ?? null });
  const mf = asMock((supabaseAdmin as unknown as { from: unknown }).from);
  mf.mockReset();
  const subs = opts.subs ?? [];
  mf.mockImplementation((table: string) => {
    if (table === 'user_roles') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve(opts.roleError ? { data: null, error: opts.roleError } : { data: opts.role === undefined ? { tenant_id: 't-1', role: 'admin', is_global: false } : opts.role, error: null }),
          }),
        }),
      };
    }
    if (table === 'saas_subscriptions') {
      return {
        select: () => ({
          eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: subs, error: null }) }) }),
        }),
      };
    }
    return {};
  });
}

const fakeHandler = jest.fn(async () => NextResponse.json({ ok: true }));

beforeEach(() => {
  jest.restoreAllMocks();
  fakeHandler.mockClear();
});

describe('withAuth characterization', () => {
  it('1) sem Authorization -> 401', async () => {
    setup({});
    const res = await withAuth(fakeHandler)(req('GET', null));
    expect(res.status).toBe(401);
    expect(fakeHandler).not.toHaveBeenCalled();
  });
  it('2) token invalido -> 401', async () => {
    setup({ user: null, authError: { message: 'bad' } });
    const res = await withAuth(fakeHandler)(req('GET'));
    expect(res.status).toBe(401);
  });
  it('3) sem roleRecord -> 403 PENDING_APPROVAL', async () => {
    setup({ role: null });
    const res = await withAuth(fakeHandler)(req('GET'));
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'PENDING_APPROVAL' });
  });
  it('4) role fora de allowedRoles -> 403', async () => {
    setup({ role: { tenant_id: 't-1', role: 'attendant', is_global: false } });
    const res = await withAuth(fakeHandler, ['admin'])(req('GET'));
    expect(res.status).toBe(403);
  });
  it('5) allowedRoles inclui role -> 200', async () => {
    setup({ role: { tenant_id: 't-1', role: 'admin', is_global: false } });
    const res = await withAuth(fakeHandler, ['admin'])(req('GET'));
    expect(res.status).toBe(200);
    expect(fakeHandler).toHaveBeenCalled();
  });
  it('6) requireGlobal + superadmin nao-global -> 403 GLOBAL_ONLY', async () => {
    setup({ role: { tenant_id: 't-1', role: 'superadmin', is_global: false } });
    const res = await withAuth(fakeHandler, ['superadmin'], { requireGlobal: true })(req('GET'));
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'GLOBAL_ONLY' });
  });
  it('7) requireGlobal + superadmin global -> 200', async () => {
    setup({ role: { tenant_id: 't-1', role: 'superadmin', is_global: true } });
    const res = await withAuth(fakeHandler, ['superadmin'], { requireGlobal: true })(req('GET'));
    expect(res.status).toBe(200);
    expect(fakeHandler).toHaveBeenCalled();
  });
  it('8) superadmin global + allowedRoles vazio -> 200', async () => {
    setup({ role: { tenant_id: 't-1', role: 'superadmin', is_global: true } });
    const res = await withAuth(fakeHandler, [])(req('GET'));
    expect(res.status).toBe(200);
  });
  it('9) tenant suspended + POST -> 403 SAAS_READONLY', async () => {
    setup({
      role: { tenant_id: 't-1', role: 'admin', is_global: false },
      subs: [{ status: 'active', next_due_date: past10d, trial_ends_at: null }],
    });
    const res = await withAuth(fakeHandler, ['admin'])(req('POST'));
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'SAAS_READONLY' });
  });
  it('10) tenant suspended + GET -> 200 leitura', async () => {
    setup({
      role: { tenant_id: 't-1', role: 'admin', is_global: false },
      subs: [{ status: 'active', next_due_date: past10d, trial_ends_at: null }],
    });
    const res = await withAuth(fakeHandler, ['admin'])(req('GET'));
    expect(res.status).toBe(200);
  });
});

describe('withAuth: branches descobertos', () => {
  const past20d = new Date(Date.now() - 20 * DAY).toISOString().slice(0, 10);

  it('11) roleError em user_roles -> 409 MULTI_TENANT_SELECT', async () => {
    setup({ roleError: { message: 'multiple rows' } });
    const res = await withAuth(fakeHandler)(req('GET'));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: 'MULTI_TENANT_SELECT' });
    expect(fakeHandler).not.toHaveBeenCalled();
  });

  it('12) SaaS gate blocked (vencido >15d) -> 403 com mensagem de suspensao', async () => {
    setup({
      role: { tenant_id: 't-1', role: 'admin', is_global: false },
      subs: [{ status: 'active', next_due_date: past20d, trial_ends_at: null }],
    });
    const res = await withAuth(fakeHandler, ['admin'])(req('POST'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toMatchObject({ code: 'SAAS_READONLY' });
    expect(body.error).toContain('Assinatura suspensa');
  });

  it('13) role sem tenant_id -> gate SaaS ignorado (POST passa)', async () => {
    setup({
      role: { tenant_id: null, role: 'admin', is_global: false },
      subs: [{ status: 'active', next_due_date: past20d, trial_ends_at: null }],
    });
    const res = await withAuth(fakeHandler, ['admin'])(req('POST'));
    expect(res.status).toBe(200);
    expect(fakeHandler).toHaveBeenCalled();
  });

  it('14) erro na query de saas_subscriptions -> fail-open 200', async () => {
    setup({ role: { tenant_id: 't-1', role: 'admin', is_global: false } });
    const mf = asMock((supabaseAdmin as unknown as { from: unknown }).from);
    mf.mockImplementation((table: string) => {
      if (table === 'user_roles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({ data: { tenant_id: 't-1', role: 'admin', is_global: false }, error: null }),
            }),
          }),
        };
      }
      if (table === 'saas_subscriptions') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({ limit: () => Promise.resolve({ data: null, error: { message: 'query failed' } }) }),
            }),
          }),
        };
      }
      return {};
    });
    const res = await withAuth(fakeHandler, ['admin'])(req('POST'));
    expect(res.status).toBe(200);
    expect(fakeHandler).toHaveBeenCalled();
  });

  it('15) sem x-forwarded-for usa x-real-ip na chave do rate-limit', async () => {
    setup({});
    const r = new NextRequest('http://localhost/api/x', {
      method: 'GET',
      headers: { authorization: 'Bearer t', 'x-real-ip': '9.9.9.9' },
    });
    const res = await withAuth(fakeHandler)(r);
    expect(res.status).toBe(200);
    expect(asMock(checkRateLimit)).toHaveBeenCalledWith('api:9.9.9.9', expect.anything());
  });

  it('16) sem nenhum header de IP usa a chave unknown', async () => {
    setup({});
    const res = await withAuth(fakeHandler)(req('GET'));
    expect(res.status).toBe(200);
    expect(asMock(checkRateLimit)).toHaveBeenCalledWith('api:unknown', expect.anything());
  });

  it('17) props.params (Promise) chega resolvida no handler', async () => {
    setup({});
    const res = await withAuth(fakeHandler)(req('GET'), { params: Promise.resolve({ id: 'x' }) });
    expect(res.status).toBe(200);
    expect(fakeHandler).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        auth: expect.objectContaining({ userId: 'user-1', tenantId: 't-1', role: 'admin' }),
        params: { id: 'x' },
      }),
    );
  });

  it('18) handler que lanca excecao -> 500 generico', async () => {
    setup({});
    const throwing = jest.fn(async (): Promise<NextResponse> => {
      throw new Error('boom interno');
    });
    const res = await withAuth(throwing)(req('GET'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'Erro interno no servidor. Tente novamente.' });
  });

  it('19) superadmin passa mesmo fora de allowedRoles (bypass)', async () => {
    setup({ role: { tenant_id: 't-1', role: 'superadmin', is_global: false } });
    const res = await withAuth(fakeHandler, ['admin'])(req('GET'));
    expect(res.status).toBe(200);
    expect(fakeHandler).toHaveBeenCalled();
  });

  it('20) x-forwarded-for presente usa o primeiro IP na chave do rate-limit', async () => {
    setup({});
    const r = new NextRequest('http://localhost/api/x', {
      method: 'GET',
      headers: { authorization: 'Bearer t', 'x-forwarded-for': '1.1.1.1, 2.2.2.2', 'x-real-ip': '9.9.9.9' },
    });
    const res = await withAuth(fakeHandler)(r);
    expect(res.status).toBe(200);
    expect(asMock(checkRateLimit)).toHaveBeenCalledWith('api:1.1.1.1', expect.anything());
  });
});

