'use client';

import React, { useEffect, useState } from 'react';

interface KPIData {
  totalLives: number;
  activeContracts: number;
  monthlyRevenue: number;
  overdueAmount: number;
  overdueCount: number;
  burialsThisMonth: number;
}

export function DashboardKPIs() {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKPIs() {
      try {
        const res = await fetch('/api/dashboard/kpis', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('supabase_token') || ''}`,
          },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadKPIs();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-800 rounded-xl" />
        ))}
      </div>
    );
  }

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
        <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
          <span>Vidas Cobertas</span>
          <span>👥</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{data?.totalLives || 0}</span>
          <span className="text-xs text-slate-500">({data?.activeContracts || 0} contratos)</span>
        </div>
        <p className="text-xs text-emerald-400 mt-1">Plano familiar ativo</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
        <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
          <span>Receita do Mês</span>
          <span>💰</span>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-emerald-400">{formatBRL(data?.monthlyRevenue || 0)}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Entradas em mensalidades</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
        <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
          <span>Inadimplência</span>
          <span>⚠</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-rose-400">{formatBRL(data?.overdueAmount || 0)}</span>
        </div>
        <p className="text-xs text-rose-400/80 mt-1">{data?.overdueCount || 0} parcelas pendentes</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
        <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase">
          <span>Sepultamentos no Mês</span>
          <span>⚰</span>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-blue-400">{data?.burialsThisMonth || 0}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Atendimentos concluídos</p>
      </div>
    </div>
  );
}
