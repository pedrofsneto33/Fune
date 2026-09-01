import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import QRCode from 'qrcode';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

interface Props {
  params: Promise<{ cpf: string }>;
}

export default async function CarteirinhaPage({ params }: Props) {
  const resolvedParams = await params;
  const rawCpf = decodeURIComponent(resolvedParams.cpf || '').replace(/\D/g, '');

  let holder: any = null;
  let tenant: any = null;
  let lookupError: string | null = null;

  if (!rawCpf) {
    lookupError = 'CPF ausente no link da carteirinha.';
  } else {
    const formattedCpf =
      rawCpf.length === 11
        ? rawCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        : null;
    const orFilter = formattedCpf
      ? `cpf.eq.${rawCpf},cpf.eq.${formattedCpf}`
      : `cpf.eq.${rawCpf}`;

    const { data, error } = await supabaseAdmin
      .from('holders')
      .select(
        `id, full_name, cpf, tenant_id,
         contracts ( status, plans ( name ) ),
         dependents ( full_name, relation )`
      )
      .or(orFilter)
      .limit(1)
      .maybeSingle();

    if (error) {
      lookupError = 'Erro ao consultar o cadastro. Tente novamente em instantes.';
    } else if (!data) {
      lookupError = 'Nenhum associado encontrado com este CPF.';
    } else {
      holder = data as any;
      const { data: t } = await supabaseAdmin
        .from('tenants')
        .select('trade_name, name, logo_url, primary_color, phone_emergency')
        .eq('id', holder.tenant_id || '')
        .maybeSingle();
      tenant = t;
    }
  }

  const tenantName = tenant?.trade_name || tenant?.name || 'Assistencia Funeraria';
  const accent = tenant?.primary_color || '#1e40af';

  let shareUrl = '/';
  try {
    const hdrs = await headers();
    const host = hdrs.get('host');
    const proto = host?.includes('localhost') ? 'http' : 'https';
    if (host) shareUrl = `${proto}://${host}/carteirinha/${rawCpf}`;
  } catch {
    // fallback: URL relativa
  }

  // Gera QR Code com o link publico da carteirinha
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(shareUrl, {
      width: 192,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch {
    qrDataUrl = null;
  }

  // ---------- Pagina de erro amigavel (sem 404 em ingles) ----------
  if (!holder) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <ShieldAlert className="text-amber-600" size={28} />
          </div>
          <h1 className="text-lg font-bold text-slate-800 mb-2">
            Carteirinha nao localizada
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {lookupError ||
              'Verifique se o link esta correto ou se o cadastro esta ativo.'}
          </p>
          <p className="text-xs text-slate-400">
            EternityOS by PrimeX Sistemas
          </p>
        </div>
      </main>
    );
  }

  // ---------- Dados do titular ----------
  const contract = Array.isArray(holder.contracts)
    ? holder.contracts.find((c: any) => c.status === 'active') ||
      holder.contracts[0]
    : holder.contracts;
  const planName = contract?.plans?.name || 'Plano Familiar';
  const status = (contract?.status || 'pending').toLowerCase();
  const statusMap: Record<string, { label: string; cls: string }> = {
    active: { label: 'Ativo', cls: 'bg-emerald-100 text-emerald-700' },
    suspended: { label: 'Suspenso', cls: 'bg-amber-100 text-amber-700' },
    pending: { label: 'Pendente', cls: 'bg-slate-200 text-slate-600' },
  };
  const st = statusMap[status] || statusMap.pending;

  const maskedCpf =
    rawCpf.length === 11
      ? `***.${rawCpf.slice(3, 6)}.${rawCpf.slice(6, 9)}-**`
      : holder.cpf || '-';

  const dependents: any[] = Array.isArray(holder.dependents)
    ? holder.dependents
    : [];

  const initials = (holder.full_name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0])
    .join('')
    .toUpperCase();

  const waText = encodeURIComponent(
    `Minha carteirinha digital - ${tenantName}: ${shareUrl}`
  );
  const waLink = `https://wa.me/?text=${waText}`;
  const emergencyPhone = (tenant?.phone_emergency || '').replace(/\D/g, '');

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
        <div className="px-6 py-5 flex items-center gap-3" style={{ backgroundColor: accent }}>
          {tenant?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt={tenantName} className="w-11 h-11 rounded-full bg-white object-contain p-1" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
              {tenantName.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-bold leading-tight truncate">{tenantName}</p>
            <p className="text-white/70 text-xs">Carteirinha Digital</p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg mb-2">
                {initials}
              </div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">{holder.full_name}</h1>
              <p className="text-sm text-slate-500 font-mono mt-0.5">{maskedCpf}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">{planName}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
              </div>
            </div>
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR Code da carteirinha" className="w-24 h-24 rounded-lg border border-slate-200 shrink-0" />
            )}
          </div>

          {dependents.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Dependentes</p>
              <ul className="space-y-1.5">
                {dependents.map((dependent: any, index: number) => (
                  <li key={`${dependent.full_name}-${index}`} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 truncate">{dependent.full_name}</span>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">{dependent.relation || 'Dependente'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-2">
            {emergencyPhone && (
              <a href={`tel:${emergencyPhone}`} className="flex items-center justify-center rounded-xl py-3 text-sm font-bold text-white" style={{ backgroundColor: accent }}>
                Plantão 24h — ligar agora
              </a>
            )}
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-xl py-3 text-sm font-bold bg-emerald-500 text-white">
              Compartilhar no WhatsApp
            </a>
          </div>
        </div>

        <div className="px-6 pb-4 text-center">
          <p className="text-[11px] text-slate-400">Documento digital de identificação do associado</p>
          <p className="text-[11px] text-slate-300 mt-0.5">EternityOS by PrimeX Sistemas</p>
        </div>
      </div>
    </main>
  );
}
