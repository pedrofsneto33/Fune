'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function ModalDRE({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [data, setData] = useState({
    grossRevenue: 0,
    operatingCosts: 0,
    adminExpenses: 0,
    netResult: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      supabase
        .from('financial_transactions')
        .select('amount, type, category')
        .then(({ data: txs, error }) => {
          if (!error && txs) {
            let grossRevenue = 0;
            let operatingCosts = 0;
            let adminExpenses = 0;

            txs.forEach((t) => {
              const val = Number(t.amount || 0);
              if (t.type === 'income') {
                grossRevenue += val;
              } else if (t.type === 'expense') {
                if (t.category === 'Despesas Administrativas') {
                  adminExpenses += val;
                } else {
                  operatingCosts += val;
                }
              }
            });

            const netResult = grossRevenue - (operatingCosts + adminExpenses);
            setData({ grossRevenue, operatingCosts, adminExpenses, netResult });
          }
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

    const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0d111a] border border-slate-800 rounded-xl max-w-lg w-full p-6 text-white shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
            <span>📊</span> Demonstrativo de Resultado do Exercício (DRE)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold">✕</button>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Calculando demonstrativo contábil...</p>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-300 font-semibold">(+) RECEITA BRUTA OPERACIONAL</span>
              <span className="text-emerald-400 font-bold">{fmtBRL(data.grossRevenue)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-300 font-semibold">(-) CUSTOS OPERACIONAIS (Urnas, Tanato, Cemitério)</span>
              <span className="text-rose-400 font-bold">{fmtBRL(data.operatingCosts)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-300 font-semibold">(-) DESPESAS ADMINISTRATIVAS & FROTA</span>
              <span className="text-rose-400 font-bold">{fmtBRL(data.adminExpenses)}</span>
            </div>
            <div className="flex justify-between py-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-sm mt-4">
              <span className="font-extrabold text-white">(=) RESULTADO LÍQUIDO DO PERÍODO</span>
              <span className={data.netResult >= 0 ? 'font-extrabold text-emerald-400' : 'font-extrabold text-rose-400'}>
                {fmtBRL(data.netResult)}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold">
            Fechar Relatório
          </button>
        </div>
      </div>
    </div>
  );
}
