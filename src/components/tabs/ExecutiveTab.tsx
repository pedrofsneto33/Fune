// Extraido de page.tsx (~2127). Unica aba sem equivalente.
// Fase 6c: KPIs executivos com fetch proprio (authFetch) — sem copiar
// estado do monolito. page.tsx permanece intacto ate a Fase 6d.

'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from 'recharts';
import { ExecutiveKpis, ExecutiveMonthlyPoint } from '@/types/domain';
import { authFetch } from '@/lib/authFetch';
import { notifyError } from '@/lib/notify';

const fmtBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ExecutiveTab() {
  const [kpis, setKpis] = useState<ExecutiveKpis | null>(null);
  const [monthly, setMonthly] = useState<ExecutiveMonthlyPoint[]>([]);
  const [openBurials, setOpenBurials] = useState(0);
  const [fleetTotal, setFleetTotal] = useState(0);
  const [fleetAvail, setFleetAvail] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const [kRes, sRes, bRes, vRes] = await Promise.all([
          authFetch('/api/dashboard/kpis'),
          authFetch('/api/financial/summary'),
          authFetch('/api/chapel/burials'),
          authFetch('/api/vehicles'),
        ]);
        const k = await kRes.json().catch(() => null);
        const s = await sRes.json().catch(() => null);
        const b = await bRes.json().catch(() => []);
        const v = await vRes.json().catch(() => []);
        if (cancel) return;
        if (k && typeof k.monthlyRevenue === 'number') setKpis(k);
        const series = Array.isArray(s?.incomeByMonth) ? s.incomeByMonth : [];
        setMonthly(
          series.map((p: { month: string; income: number; expense: number }) => ({
            month: p.month,
            income: Number(p.income) || 0,
            expense: Number(p.expense) || 0,
            net: (Number(p.income) || 0) - (Number(p.expense) || 0),
          })),
        );
        const burials = Array.isArray(b) ? b : [];
        setOpenBurials(
          burials.filter(
            (x: { status?: string }) =>
              !['concluído', 'concluido', 'cancelado'].includes(
                (x.status || '').toLowerCase(),
              ),
          ).length,
        );
        const fleet = Array.isArray(v) ? v : [];
        setFleetTotal(fleet.length);
        setFleetAvail(
          fleet.filter((x: { status?: string }) => {
            const st = (x.status || '').toLowerCase();
            return st.length > 0 && st !== 'em missão' && !st.startsWith('manuten');
          }).length,
        );
      } catch {
        if (!cancel) notifyError('Erro ao carregar KPIs executivos.');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);
  if (loading && !kpis) {
    return <p className="p-6 text-xs text-slate-600 dark:text-slate-400">Carregando KPIs…</p>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold">MRR Recorrente</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{fmtBRL(kpis?.monthlyRevenue || 0)}</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{kpis?.activeContracts || 0} contratos ativos</p>
        </div>
        <div className="bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold">Vidas</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{kpis?.totalLives || 0}</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Inadimplentes: {kpis?.overdueCount || 0}</p>
        </div>
        <div className="bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold">Missoes em Aberto</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{openBurials}</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Plantao em atendimento</p>
        </div>
        <div className="bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold">Veiculos Disponiveis</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{fleetAvail}</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{fleetTotal} veiculos na frota</p>
        </div>
      </div>
      <div className="bg-white dark:bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-2">Receita vs Despesa (ms)</p>
        {monthly.length === 0 ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-500">Sem movimentao financeira neste período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3a9', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3a9', fontSize: 10 }} tickFormatter={fmtBRL} />
              <Tooltip contentStyle={{ backgroundColor: '#0d121f', border: '1px solid #33415b', borderRadius: 6 }} formatter={(value: number | string | number[]) => [fmtBRL(Number(value)), '']} />
              <Legend wrapperStyle={{ color: '#94a3a9' }} />
              <Bar dataKey="income" name="Receitas" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Despesas" fill="#dc2626" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="net" name="Resultado" stroke="#06b6d6" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
