'use client';

import React, { useEffect, useState } from 'react';
import { Award, DollarSign, UserCheck, Clock, CheckCircle2 } from 'lucide-react';

interface Commission {
  id: string;
  seller_name: string;
  amount: number;
  status: string;
  created_at: string;
  contracts?: {
    id: string;
    holders?: {
      name: string;
    };
  };
}

export function CommissionsPanel() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sales/commission')
      .then(res => res.json())
      .then(res => {
        if (res.success) setCommissions(res.commissions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalCommissions = commissions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalPending = commissions.filter(c => c.status !== 'paid').reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm animate-pulse">
        Carregando painel de comissões de corretores e vendedores...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Comissões</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            R$ {totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pagas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pendentes</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">
            R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Listagem de Lançamentos */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Extrato de Comissões por Venda</h3>
          </div>
          <span className="text-xs text-slate-400">{commissions.length} registros</span>
        </div>

        {commissions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhuma comissão registrada até o momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/50 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Vendedor / Corretor</th>
                  <th className="p-4">Titular Vinculado</th>
                  <th className="p-4">Data da Venda</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-semibold text-white flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {c.seller_name}
                    </td>
                    <td className="p-4 text-slate-300">
                      {c.contracts?.holders?.name || 'Venda Direta'}
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 font-semibold text-white">
                      R$ {Number(c.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      {c.status === 'paid' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Pago
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Pendente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}