import React from 'react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ShieldCheck, ShieldAlert, CheckCircle2, User, Users, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ cpf: string }>;
}

export const dynamic = 'force-dynamic';

export default async function CarteirinhaPage({ params }: PageProps) {
  const resolvedParams = await params;
  const rawCpf = resolvedParams?.cpf || '';
  const cleanCpf = rawCpf.replace(/\D/g, '');

  if (!cleanCpf || cleanCpf.length !== 11) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">CPF Inválido</h1>
          <p className="text-slate-400 text-sm mb-6">
            O documento informado não possui o formato regular de 11 dígitos.
          </p>
          <Link href="/" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium text-slate-200 transition-colors">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  // 1. Consulta segura via backend com correspondência exata
  const { data: holder, error: holderErr } = await supabaseAdmin
    .from('holders')
    .select('id, name, created_at')
    .eq('cpf', cleanCpf)
    .single();

  if (holderErr || !holder) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Associado Não Localizado</h1>
          <p className="text-slate-400 text-sm mb-6">
            Nenhum contrato ativo foi encontrado para os dados informados. Em caso de dúvidas, consulte o suporte 24h.
          </p>
          <Link href="/" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-medium text-white transition-colors">
            Página Principal
          </Link>
        </div>
      </div>
    );
  }

  // 2. Buscar Contrato e Plano Ativo
  const { data: contract } = await supabaseAdmin
    .from('contracts')
    .select('id, status, plan_id, created_at, plans(name, grace_period_days)')
    .eq('holder_id', holder.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // 3. Buscar Dependentes elegíveis
  const { data: dependents } = await supabaseAdmin
    .from('dependents')
    .select('id, name, relationship')
    .eq('holder_id', holder.id);

  const planName = (contract as any)?.plans?.name || 'Plano Familiar Tradicional';
  const isContractActive = contract?.status === 'ativo' || contract?.status === 'pago';
  const memberSince = holder.created_at ? new Date(holder.created_at).toLocaleDateString('pt-BR') : 'Ativo';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 antialiased">
      <div className="w-full max-w-md">
        
        {/* Cartão Digital */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Cabeçalho */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                Carteirinha Digital
              </span>
              <h2 className="text-lg font-bold text-white mt-1.5">Plano de Assistência</h2>
            </div>
            {isContractActive ? (
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Regular</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4" />
                <span>Pendente</span>
              </div>
            )}
          </div>

          {/* Dados do Titular */}
          <div className="py-5 space-y-4">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Titular</span>
              <div className="flex items-center gap-2 mt-0.5">
                <User className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-base font-semibold text-white truncate">{holder.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Plano</span>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">{planName}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Adesão</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-sm font-medium text-slate-200">{memberSince}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dependentes Inclusos */}
          {dependents && dependents.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Dependentes Vinculados ({dependents.length})
                </span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                {dependents.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/50 text-slate-300">
                    <span className="font-medium truncate mr-2">{dep.name}</span>
                    <span className="text-[10px] uppercase text-emerald-400/80 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/30 shrink-0">
                      {dep.relationship || 'Dependente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rodapé do Cartão */}
          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Validação Oficial 24h</span>
            <span className="font-mono">ID: {holder.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>

        {/* Informações de Suporte e Emergência */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-slate-400">Central de Atendimento 24 Horas</p>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3.5 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Documento Digital Autenticado</span>
          </div>
        </div>

      </div>
    </div>
  );
}