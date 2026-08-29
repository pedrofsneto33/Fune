'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, User, Calendar, CreditCard, Sparkles, Printer, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function CarteirinhaPage() {
  const params = useParams();
  const rawCpf = params?.cpf as string;
  const [holderData, setHolderData] = useState<any>(null);
  const [dependents, setDependents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCardData() {
      if (!rawCpf) return;
      setLoading(true);
      try {
        const cleanDigits = rawCpf.replace(/\D/g, '');
        
        const { data: holders, error } = await supabase
          .from('holders')
          .select('id, full_name, cpf, phone, contracts(id, status, created_at, plans(name, monthly_fee))')
          .order('created_at', { ascending: false });

        if (holders) {
          const matched = holders.find(h => (h.cpf || '').replace(/\D/g, '') === cleanDigits);
          if (matched) {
            setHolderData(matched);
            const { data: depData } = await supabase
              .from('dependents')
              .select('*')
              .eq('holder_id', matched.id);
            setDependents(depData || []);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar carteirinha:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCardData();
  }, [rawCpf]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-sm">
        Carregando credencial digital...
      </div>
    );
  }

  if (!holderData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 p-4">
        <p className="text-base text-red-400 font-semibold mb-2">Associado não localizado</p>
        <p className="text-xs text-zinc-500 mb-4">Nenhum contrato ativo foi encontrado para o CPF informado.</p>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-zinc-800 text-zinc-200 rounded-lg text-xs font-medium"
        >
          Fechar Janela
        </button>
      </div>
    );
  }

  const contract = holderData.contracts?.[0];
  const planName = contract?.plans?.name || 'Plano Padrão';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 print:p-0 print:bg-white print:text-black font-sans">
      
      {/* Ações Superiores */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 print:hidden">
        <button
          onClick={() => window.close()}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Fechar
        </button>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-2 transition"
        >
          <Printer className="w-3.5 h-3.5" /> Imprimir / Salvar PDF
        </button>
      </div>

      {/* Cartão do Associado */}
      <div className="w-full max-w-md bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden print:border-black print:shadow-none">
        
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider uppercase text-white print:text-black">Eternity OS</h1>
              <p className="text-[10px] text-emerald-400 font-medium">CREDENCIAL DO ASSOCIADO</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {contract?.status === 'active' ? 'ATIVO' : 'REGULAR'}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Titular do Plano</p>
            <p className="text-base font-bold text-white print:text-black">{holderData.full_name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">CPF</p>
              <p className="text-xs font-mono font-medium text-zinc-200 print:text-black">{holderData.cpf}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Plano</p>
              <p className="text-xs font-semibold text-emerald-400 print:text-black">{planName}</p>
            </div>
          </div>

          {dependents.length > 0 && (
            <div className="pt-2 border-t border-zinc-800 print:border-zinc-300">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">
                Dependentes Vinculados ({dependents.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dependents.map((dep) => (
                  <span
                    key={dep.id}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 print:bg-zinc-100 print:text-black"
                  >
                    {dep.full_name} ({dep.relation})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 print:border-zinc-300">
          <span>Plantão 24h: Suporte Imediato</span>
          <span className="font-mono">ID: {holderData.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

    </div>
  );
}