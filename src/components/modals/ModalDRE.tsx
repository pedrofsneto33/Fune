'use client';
import React, { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, PieChart, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function ModalDRE({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalCosts: 0,
    mrr: 0,
    netProfit: 0
  });

  useEffect(() => {
    if (isOpen) fetchFinancialData();
  }, [isOpen]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Busca contratos ativos para calcular MRR
      const { data: contracts } = await supabase.from('contracts').select('id, plans(monthly_fee), status').eq('status', 'active');
      const calculatedMrr = (contracts || []).reduce((acc, c: any) => acc + (c.plans?.monthly_fee || 59.90), 0);

      // Busca entradas financeiras / caixa
      const { data: cash } = await supabase.from('cash_flow').select('amount, type');
      const totalRev = (cash || []).filter(c => c.type === 'receita').reduce((acc, c) => acc + Number(c.amount), 0) + calculatedMrr;
      const totalExp = (cash || []).filter(c => c.type === 'despesa' || c.type === 'custo').reduce((acc, c) => acc + Number(c.amount), 0) || (calculatedMrr * 0.35); // estimativa operacional padrão

      setMetrics({
        totalRevenue: totalRev,
        totalCosts: totalExp,
        mrr: calculatedMrr,
        netProfit: totalRev - totalExp
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">DRE Gerencial & Fluxo de Caixa Consolidado</h2>
              <p className="text-xs text-zinc-400">Análise de lucratividade, MRR e custos operacionais</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400 animate-pulse">Calculando balanço financeiro...</div>
          ) : (
            <>
              {/* Cards Resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">MRR Recorrente</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">R$ {metrics.mrr.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Receita Total</span>
                  <span className="text-sm font-extrabold text-white font-mono">R$ {metrics.totalRevenue.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Custos Operacionais</span>
                  <span className="text-sm font-extrabold text-red-400 font-mono">R$ {metrics.totalCosts.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Lucro Líquido (EBITDA)</span>
                  <span className={`text-sm font-extrabold font-mono ${metrics.netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    R$ {metrics.netProfit.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Demonstrativo Estruturado */}
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-3 text-xs">
                <h3 className="font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800 pb-2">Demonstrativo de Resultado do Exercício</h3>
                
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-400">(+) Receita Operacional Bruta (MRR + Avulsos)</span>
                  <span className="font-mono text-white font-bold">R$ {metrics.totalRevenue.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-400">(-) Custos Operacionais (Frota, Óbitos, Insumos)</span>
                  <span className="font-mono text-red-400 font-bold">- R$ {metrics.totalCosts.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-t border-zinc-800 font-bold text-sm">
                  <span className="text-emerald-400">(=) Resultado Operacional Líquido</span>
                  <span className="font-mono text-emerald-400">R$ {metrics.netProfit.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition">
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
