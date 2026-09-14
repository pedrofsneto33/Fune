'use client';

// ⚠️ Réplica local de isContractActive — NÃO importar de src/lib/eligibility.ts

import React, { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { notifyError } from '@/lib/notify';
import type { ContractPlan, Contract } from '@/types';

// Réplica local de isContractActive — NÃO importar de src/lib/eligibility.ts
const isContractActive = (status: string | null | undefined): boolean => {
  return status === 'active' || status === 'ativo';
};

export default function ContratosPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContracts = async () => {
      setLoading(true);
      try {
        const res = await authFetch('/api/contracts');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setContracts(data);
        } else {
          const j = await res.json().catch(() => ({}));
          notifyError('Erro ao carregar contratos: ' + (j.error || 'falha'));
        }
      } catch {
        notifyError('Erro de conexão ao carregar contratos.');
      } finally {
        setLoading(false);
      }
    };
    loadContracts();
  }, []);

  const fmtDate = (d: string) => {
    if (!d) return '—';
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
    } catch {
      return d;
    }
  };

  const fmtBRL = (v: number) => {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Contratos</h1>
      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : contracts.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum contrato encontrado.</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase text-xs">
              <tr>
                <th className="py-3 px-4">Titular</th>
                <th className="py-3 px-4">Plano</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Data início</th>
                <th className="py-3 px-4">Fee mensal</th>
                <th className="py-3 px-4">Elegibilidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {contracts.map((c) => {
                const eligible = isContractActive(c.status);
                const holderName = c.holders?.full_name || c.holders?.name || '—';
                const planName = c.plans?.name || '—';
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-950">
                    <td className="py-2 px-4">{holderName}</td>
                    <td className="py-2 px-4">{planName}</td>
                    <td className="py-2 px-4">{c.status}</td>
                    <td className="py-2 px-4">{fmtDate(c.start_date)}</td>
                    <td className="py-2 px-4">{fmtBRL(Number(c.plans?.monthly_fee) || 0)}</td>
                    <td className="py-2 px-4">
                      {eligible ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs font-bold">
                          Elegível
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 text-xs font-bold">
                          Inelegível: contrato inativo
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
