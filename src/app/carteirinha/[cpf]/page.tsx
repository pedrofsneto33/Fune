import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import QRCode from 'qrcode';

interface Props {
  params: Promise<{ cpf: string }>;
}

export default async function CarteirinhaPage({ params }: Props) {
  const resolvedParams = await params;
  const rawCpf = decodeURIComponent(resolvedParams.cpf || '').replace(/\D/g, '');

  if (!rawCpf || rawCpf.length !== 11) {
    notFound();
  }

  const formattedCpf = rawCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  const { data: holder, error } = await supabaseAdmin
    .from('holders')
    .select(`
      id,
      full_name,
      cpf,
      tenant_id,
      contracts (
        status,
        plans ( name )
      ),
      dependents (
        full_name,
        relation
      )
    `)
    .or(`cpf.eq.${rawCpf},cpf.eq.${formattedCpf}`)
    .limit(1)
    .maybeSingle();

  if (error || !holder) {
    notFound();
  }

  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('trade_name, name, logo_url, primary_color, phone_emergency')
    .eq('id', (holder as { tenant_id?: string }).tenant_id || '')
    .maybeSingle();

  const tenantName = tenant?.trade_name || tenant?.name || 'Assistencia Funeraria';
  const accent = tenant?.primary_color || '#1e40af';
  const h = holder as any;
  const planName = h.contracts?.[0]?.plans?.name || 'Plano nao vinculado';
  const statusRaw = h.contracts?.[0]?.status;
  const statusLabel = statusRaw === 'active' ? 'Ativo' : statusRaw === 'suspended' ? 'Suspenso' : 'Pendente';
  const statusStyle =
    statusRaw === 'active'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
      : statusRaw === 'suspended'
        ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
        : 'bg-slate-500/15 text-slate-400 border-slate-500/40';
  const dependents: { full_name: string; relation: string }[] = h.dependents || [];

  // URL absoluta para compartilhamento
  let shareUrl = '/';
  try {
    const hdrs = await headers();
    const host = hdrs.get('host');
    const proto = host?.includes('localhost') ? 'http' : 'https';
    if (host) shareUrl = `${proto}://${host}/carteirinha/${rawCpf}`;
  } catch {
    // fallback: URL relativa
  }
  const waShare = `https://wa.me/?text=${encodeURIComponent(`Meu comprovante de assistencia - ${tenantName}: ${shareUrl}`)}`;
  const qrDataUrl = await QRCode.toDataURL(shareUrl, { width: 240, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0f172a', light: '#ffffff' } });
  const initials = holder.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1020] to-[#07090e] flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Faixa da funeraria */}
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}>
          {tenant?.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={tenant.logo_url} alt={tenantName} className="h-10 w-10 rounded-lg object-contain bg-white/90 p-0.5" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-white/15 flex items-center justify-center text-white font-black text-sm">
              {initials || 'OS'}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{tenantName}</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wider">Carteirinha Digital de Assistencia</p>
          </div>
        </div>

        {/* Titular */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">Titular</p>
            <h1 className="text-lg font-bold text-white leading-tight">{holder.full_name}</h1>
            <p className="text-xs font-mono text-slate-400 mt-1">CPF ***.{rawCpf.substring(3, 6)}.***-**</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusStyle}`}>
              {statusLabel}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-500/15 text-blue-300 border border-blue-500/40">
              {planName}
            </span>
          </div>

          {/* Dependentes */}
          <div className="border-t border-slate-800 pt-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
              Dependentes ({dependents.length})
            </p>
            {dependents.length > 0 ? (
              <ul className="space-y-1.5">
                {dependents.map((d, i) => (
                  <li key={i} className="flex items-center justify-between text-xs bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5">
                    <span className="text-slate-200 font-medium truncate">{d.full_name}</span>
                    <span className="text-slate-500 text-[10px] uppercase ml-2 shrink-0">{d.relation || '--'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Nenhum dependente cadastrado.</p>
            )}
          </div>

          {/* Plantao 24h */}
          {tenant?.phone_emergency && (
            <a
              href={`tel:${tenant.phone_emergency.replace(/\D/g, '')}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs text-white transition hover:opacity-90"
              style={{ background: accent }}
            >
              Plantao 24h - {tenant.phone_emergency}
            </a>
          )}

          <a
            href={waShare}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition"
          >
            Compartilhar no WhatsApp
                    </a>

          {/* QR Code de verificacao de autenticidade */}
          <div className="border border-slate-800 rounded-xl bg-white p-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code de verificacao" className="h-24 w-24 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-800">Verificacao de Autenticidade</p>
              <p className="text-[10px] text-slate-600 leading-snug mt-1">Aponte a camera para o QR Code para abrir a carteirinha oficial e confirmar que ela e autentica.</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-slate-600 mt-4">
        Documento de identificacao do associado - valide pelo telefone da funeraria.
      </p>
      <p className="text-[10px] text-slate-700 mt-1">
        EternityOS <span className="text-slate-500">by</span> PrimeX Sistemas
      </p>
    </div>
  );
}