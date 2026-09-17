import { render } from '@testing-library/react';
// jsdom nao define Request/Response globais (usados por next/server). O helper
// api-mocks importa NextRequest no topo — stub evita quebrar a suite em jsdom.
jest.mock('next/server', () => ({ NextRequest: class NextRequestStub {} }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: jest.fn() }));

jest.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: jest.fn() } }));
import TrackPage from '@/app/track/[token]/page';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { makeChain } from '../helpers/api-mocks';

const asMock = (fn: unknown): jest.Mock => fn as unknown as jest.Mock;
const TENANT_OK = { name: 'Funerária Paz' };
const SO_OK = {
  deceased_name: 'João da Silva',
  burial_date: '2026-03-05T13:00:00Z',
  cemetery_location: 'Cemitério Municipal',
  status: 'in_progress',
  created_at: '2026-03-01T10:00:00Z',
  tenant_id: 'tenant-1',
  items: [{ quantity: 2, inventory: { item_name: 'Coroa de flores' } }],
};

interface TrackOpts { so?: unknown; tenant?: unknown; }
function setupTrackDb(o: TrackOpts = {}) {
  const mf = asMock((supabaseAdmin as unknown as { from: unknown }).from);
  mf.mockReset();
  const soChain = makeChain({ singleValue: { data: o.so === undefined ? SO_OK : o.so, error: null } });
  const tenantChain = makeChain({ singleValue: { data: o.tenant === undefined ? TENANT_OK : o.tenant, error: null } });
  mf.mockImplementation((table: string) =>
    table === 'service_orders' ? soChain : table === 'tenants' ? tenantChain : makeChain({}),
  );
  return { mf, soChain, tenantChain };
}

const renderToken = async (token: string) =>
  render(await TrackPage({ params: Promise.resolve({ token }) }));

beforeEach(() => {
  jest.restoreAllMocks();
});

describe('/track/[token] (Fase 15)', () => {
  it('15-track: 1) token valido + OS encontrada renderiza dados da OS', async () => {
    const { soChain } = setupTrackDb();
    const { container } = await renderToken('tok-abc123');
    expect(container.textContent).toContain('Funerária Paz');
    expect(container.textContent).toContain('João da Silva');
    expect(container.textContent).toContain('Em andamento');
    expect(container.textContent).toContain('05/03/2026');
    expect(container.textContent).toContain('Cemitério Municipal');
    expect(asMock(soChain.eq)).toHaveBeenCalledWith('tracking_token', 'tok-abc123');
  });

  it('15-track: 2) colunas explicitas (sem *) e sem status interno cru', async () => {
    const { soChain } = setupTrackDb();
    const { container } = await renderToken('tok-abc123');
    const cols = String(asMock(soChain.select).mock.calls[0][0]);
    expect(cols).not.toContain('*');
    expect(cols).toContain('deceased_name');
    expect(container.textContent).not.toContain('in_progress');
  });

  it('15-track: 3) token inexistente / OS nao encontrada -> card de link invalido (sem notFound)', async () => {
    const { mf } = setupTrackDb({ so: null });
    const { container } = await renderToken('tok-inexistente');
    expect(container.textContent).toContain('Link inválido ou expirado');
    expect(mf.mock.calls.map((c) => c[0])).toEqual(['service_orders']);
  });

  it('15-track: 4) token vazio consulta com string vazia e cai no card de link invalido', async () => {
    const { soChain } = setupTrackDb({ so: null });
    const { container } = await renderToken('');
    expect(container.textContent).toContain('Link inválido ou expirado');
    expect(asMock(soChain.eq)).toHaveBeenCalledWith('tracking_token', '');
  });

  it('15-track: 5) tenant ausente -> nome padrao (degradacao graciosa)', async () => {
    setupTrackDb({ tenant: null });
    const { container } = await renderToken('tok-abc123');
    expect(container.textContent).toContain('Assistência Funerária');
  });

  it('15-track: 6) status cancelled -> badge Cancelado', async () => {
    setupTrackDb({ so: { ...SO_OK, status: 'cancelled' } });
    const { container } = await renderToken('tok-abc123');
    expect(container.textContent).toContain('Cancelado');
  });

  it('15-track: 7) status desconhecido cai em Registrado (fallback)', async () => {
    setupTrackDb({ so: { ...SO_OK, status: 'zzz' } });
    const { container } = await renderToken('tok-abc123');
    expect(container.textContent).toContain('Registrado');
  });

  it('15-track: 8) burial_date ausente -> Data a definir', async () => {
    setupTrackDb({ so: { ...SO_OK, burial_date: null } });
    const { container } = await renderToken('tok-abc123');
    expect(container.textContent).toContain('Data a definir');
  });

  it('15-track: 9) itens renderizados (nome x quantidade); lista vazia tem aviso', async () => {
    const setup1 = setupTrackDb();
    const { container } = await renderToken('tok-abc123');
    expect(container.textContent).toContain('Coroa de flores');
    expect(container.textContent).toContain('x2');
    expect(container.textContent).not.toContain('Nenhum item registrado');
    // lista vazia (segundo render, com outra OS)
    setup1.mf.mockReset();
    setupTrackDb({ so: { ...SO_OK, items: [] } });
    const { container: c2 } = await renderToken('tok-abc123');
    expect(c2.textContent).toContain('Nenhum item registrado nesta ordem de serviço.');
    expect(c2.textContent).not.toContain('Coroa de flores');
  });
});
