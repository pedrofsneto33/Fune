import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rate-limiter';
type MockFn = jest.Mock;
const asMock = (fn: unknown): MockFn => fn as unknown as MockFn;
export function mockSupabaseAdmin(): MockFn {
  const m = asMock((supabaseAdmin as unknown as { from: unknown }).from);
  m.mockReset(); return m;
}
export function mockRateLimit(allowed = true): MockFn {
  const m = asMock(checkRateLimit); m.mockReset();
  m.mockResolvedValue({ allowed, remaining: allowed ? 59 : 0, resetAt: Date.now() + 60000 });
  return m;
}
export function mockWithAuth(role = 'admin', tenantId = 'tenant-1'): MockFn {
  const admin = supabaseAdmin as unknown as { auth: { getUser: unknown }; from: unknown };
  asMock(admin.auth.getUser).mockReset();
  asMock(admin.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  const mockFrom = asMock(admin.from);
  const prevImpl = mockFrom.getMockImplementation();
  mockFrom.mockImplementation((table: string, ...rest: unknown[]) => {
    if (table === 'user_roles') {
      return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { tenant_id: tenantId, role }, error: null }) }) }) };
    }
    if (prevImpl) return (prevImpl as (...a: unknown[]) => unknown)(table, ...rest);
    return {};
  });
  return mockFrom;
}
interface ChainValues { singleValue?: unknown; limitValue?: unknown; thenValue?: unknown; }
function makeChain(values: ChainValues = {}): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  const fb = values.thenValue ?? values.singleValue ?? values.limitValue ?? { data: null, error: null };
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.neq = jest.fn().mockReturnValue(chain);
  chain.insert = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn().mockResolvedValue(values.singleValue ?? fb);
  chain.limit = jest.fn().mockResolvedValue(values.limitValue ?? fb);
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => Promise.resolve(values.thenValue ?? fb).then(resolve as never);
  return chain;
}
export interface WdbSetup { tenant?: { id: string } | null; tenantError?: { message: string } | null; already?: Array<{ id: string }>; updated?: Array<{ id: string; amount: number; contract_id: string }>; payErr?: { message: string } | null; }
export function setupWebhookDb(mockFrom: MockFn, s: WdbSetup = {}): void {
  const tenant = s.tenant ?? { id: 'tenant-1' };
  const tErr = s.tenantError ?? null;
  const already = s.already ?? [];
  const updated = s.updated ?? [];
  const payErr = s.payErr ?? null;
  const tenantChain = makeChain({ singleValue: { data: tenant, error: tErr } });
  const dedupChain = makeChain({ limitValue: { data: already, error: null } });
  const insertSingle = jest.fn().mockResolvedValue({ data: { id: 'evt-row-1' }, error: null });
  const webhookEntry = {
    select: jest.fn().mockReturnValue(dedupChain),
    insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: insertSingle }) }),
    update: jest.fn().mockReturnValue(makeChain({ thenValue: { data: null, error: null } })),
  };
  const payChain = makeChain({ singleValue: { data: updated, error: payErr }, limitValue: { data: updated, error: payErr }, thenValue: { data: updated, error: payErr } });
  const contractsChain = makeChain({ thenValue: { data: null, error: null } });
  mockFrom.mockImplementation((table: string) => {
    if (table === 'tenants') return tenantChain;
    if (table === 'webhook_events') return webhookEntry;
    if (table === 'payments') return { update: jest.fn().mockReturnValue(payChain) };
    if (table === 'contracts') return { update: jest.fn().mockReturnValue(contractsChain) };
    return makeChain({ thenValue: { data: null, error: null } });
  });
}
export interface AReqOpts { token?: string | null; body?: unknown; rawBody?: string; ip?: string; }
export function makeAsaasRequest(o: AReqOpts = {}): NextRequest {
  const { token = 'valid-webhook-token-123', body, rawBody, ip = '1.2.3.4' } = o;
  const headers: Record<string, string> = { 'content-type': 'application/json', 'x-forwarded-for': ip };
  if (token !== null && token !== undefined) headers['asaas-access-token'] = token;
  const payload = rawBody !== undefined ? rawBody : JSON.stringify(body ?? {});
  return new NextRequest('http://localhost/api/webhooks/asaas', { method: 'POST', headers, body: payload });
}