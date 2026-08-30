'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function ModalDRE({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [data, setData] = useState({ planIncome: 0, servicesIncome: 0, totalIncome: 0, operationalExpenses: 0, totalExpenses: 0, netProfit: 0 });

  useEffect(() => {
    if (!isOpen) return;
    async function load() {
      const { data: txs } = await supabase.from('financial_transactions').select('amount, type, category');
      if (txs) {
        let pInc = 0, sInc = 0, exp = 0;
        txs.forEach((t) => {
          const val = Number(t.amount || 0);
          if (t.type === 'income') {
            if (t.category === 'plan_subscription') pInc += val;
            else sInc += val;
          } else {
            exp += val;
          }
        });
        const tot = pInc + sInc;
        setData({ planIncome: pInc, servicesIncome: sInc, totalIncome: tot, operationalExpenses: exp, totalExpenses: exp, netProfit: tot - exp });
      }
    }
    load();
  }, [isOpen]);

  if (!isOpen) return null;
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 text-white">
        <h3 className="font-bold text-base mb-4">📈 Demonstrativo de Resultado (DRE)</h3>
        <div className="space-y-2 text-xs">
          <div className="bg-slate-950 p-3 rounded">
            <p className="text-emerald-400 font-bold mb-1">RECEITAS</p>
            <div className="flex justify-between"><span>Mensalidades:</span><span>{fmt(data.planIncome)}</span></div>
            <div className="flex justify-between"><span>Serviços Avulsos:</span><span>{fmt(data.servicesIncome)}</span></div>
            <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-800">
              <span>Total Receitas:</span><span>{fmt(data.totalIncome)}</span>
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded">
            <p className="text-rose-400 font-bold mb-1">DESPESAS</p>
            <div className="flex justify-between"><span>Despesas Operacionais:</span><span>{fmt(data.operationalExpenses)}</span></div>
            <div className="flex justify-between font-bold text-rose-400 pt-1 border-t border-slate-800">
              <span>Total Despesas:</span><span>{fmt(data.totalExpenses)}</span>
            </div>
          </div>
          <div className="bg-slate-800 p-3 rounded flex justify-between font-bold text-sm">
            <span>RESULTADO LÍQUIDO:</span>
            <span className={data.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{fmt(data.netProfit)}</span>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-xs rounded">Fechar</button>
        </div>
      </div>
    </div>
  );
}
