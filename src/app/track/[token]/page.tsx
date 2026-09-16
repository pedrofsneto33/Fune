import { supabaseAdmin } from '@/lib/supabaseAdmin';

const STEPS = ['Registrado', 'Em andamento', 'Concluído'];

// Status mapping (sem expor valores internos): pending / in_progress / completed / cancelled
const STATUS_MAP: Record<string, { label: string; badge: string; step: number }> = {
  pending: { label: 'Registrado', badge: 'bg-amber-500', step: 0 },
  in_progress: { label: 'Em andamento', badge: 'bg-blue-500', step: 1 },
  completed: { label: 'Concluído', badge: 'bg-emerald-500', step: 2 },
  cancelled: { label: 'Cancelado', badge: 'bg-rose-500', step: -1 },
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Data a definir';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Data a definir';
  return parsed.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

export default async function TrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // Next 16: params é uma Promise (mesmo padrão de /carteirinha/[cpf])
  const resolvedParams = await params;
  const token = resolvedParams.token || '';

  // Query 1: OS + itens (colunas EXPLÍCITAS — nunca '*')
  const { data: so } = await supabaseAdmin
    .from('service_orders')
    .select(`
      deceased_name, burial_date, cemetery_location, status, created_at, tenant_id,
      items:service_order_items(quantity, inventory:inventory(item_name))
    `)
    .eq('tracking_token', token)
    .maybeSingle();

  // Query 2: tenant (nome da funerária)
  let tenant: any = null;
  if (so?.tenant_id) {
    const { data: t } = await supabaseAdmin
      .from('tenants')
      .select('name')
      .eq('id', so.tenant_id)
      .maybeSingle();
    tenant = t;
  }

  const tenantName = tenant?.name || 'Assistência Funerária';

  const header = (
    <div className="px-6 py-5 flex items-center gap-3 bg-slate-900">
      <span className="text-2xl" aria-hidden>
        🕊️
      </span>
      <div className="min-w-0">
        <p className="text-white font-bold leading-tight truncate">{tenantName}</p>
        <p className="text-white/70 text-xs">Acompanhamento</p>
      </div>
    </div>
  );

  const footer = (
    <div className="px-6 pb-4 text-center">
      <p className="text-[11px] text-slate-500">EternityOS by PrimeX Sistemas</p>
    </div>
  );

  // ---------- Link inválido ou expirado (mesmo layout, sem 404 em inglês) ----------
  if (!so) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          {header}
          <div className="p-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4 text-2xl">
              🔒
            </div>
            <h1 className="text-lg font-bold text-slate-800 mb-2">
              Link inválido ou expirado
            </h1>
            <p className="text-sm text-slate-600">
              Não localizamos nenhuma ordem de serviço para este link de
              acompanhamento. Solicite um novo link à funerária responsável.
            </p>
          </div>
          {footer}
        </div>
      </main>
    );
  }

  const statusKey = String(so.status || 'pending').toLowerCase();
  const st = STATUS_MAP[statusKey] || STATUS_MAP.pending;
  const isCancelled = statusKey === 'cancelled';
  const items: any[] = Array.isArray(so.items) ? so.items : [];

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {header}

        {/* Card principal: falecido + status */}
        <div className="p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Serviço de
          </p>
          <h1 className="text-xl font-bold text-slate-800 leading-tight mt-1">
            {so.deceased_name || 'Não informado'}
          </h1>
          <div className="mt-3">
            <span
              className={`inline-block text-sm font-bold text-white px-4 py-1.5 rounded-full ${st.badge}`}
            >
              {st.label}
            </span>
          </div>

          {/* Sepultamento */}
          <div className="mt-5 border-t border-slate-100 pt-4 grid grid-cols-1 gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Data do sepultamento
              </p>
              <p className="text-sm text-slate-700 mt-0.5">
                {formatDate(so.burial_date)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Local
              </p>
              <p className="text-sm text-slate-700 mt-0.5">
                {so.cemetery_location || 'A definir'}
              </p>
            </div>
          </div>

          {/* Barra de 3 steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((label, index) => (
                <span
                  key={label}
                  className={`text-[11px] font-semibold ${
                    index <= st.step ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              {STEPS.map((label, index) => (
                <div
                  key={label}
                  className={`h-1.5 flex-1 rounded-full ${
                    isCancelled
                      ? 'bg-rose-500'
                      : index <= st.step
                        ? 'bg-emerald-500'
                        : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Lista de itens (item_name x quantity) — sem preços */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Serviços e itens
            </p>
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum item registrado nesta ordem de serviço.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {items.map((item: any, index: number) => (
                  <li
                    key={`${item?.inventory?.item_name || 'item'}-${index}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-700 truncate">
                      {item?.inventory?.item_name || 'Item'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 shrink-0 ml-2">
                      x{Number(item?.quantity) || 0}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {footer}
      </div>
    </main>
  );
}
