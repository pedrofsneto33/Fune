'use client';

import { notifySuccess, notifyError, notifyInfo } from '@/lib/notify';
import React, { useEffect, useState } from 'react';
import { X, BarChart3, TrendingUp, Users, Activity, Download } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

interface BIStats {
  activeContracts: number;
  totalMissions: number;
  projectedRevenue: number;
  defaultRate: string;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl space-y-1">
      <span className="text-[10px] uppercase font-bold text-zinc-400 block">{label}</span>
      <span className={`text-xl font-extrabold font-mono flex items-center gap-2 ${color}`}>
        {icon} {value}
      </span>
    </div>
  );
}

export function ModalBIReports({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BIStats>({ activeContracts: 0, totalMissions: 0, projectedRevenue: 0, defaultRate: '0%' });

  useEffect(() => { if (isOpen) fetchBIStats(); }, [isOpen]);

  const fetchBIStats = async () => {
    setLoading(true);
    try {
      const [contractsRes, missionsRes, allContractsRes] = await Promise.all([
        authFetch('/api/contracts?status=active&count=exact'),
        authFetch('/api/service-orders?count=exact'),
        authFetch('/api/contracts?count=exact')
      ]);
      const contractsData = contractsRes.ok ? await contractsRes.json() : null;
      const missionsData = missionsRes.ok ? await missionsRes.json() : null;
      const allContractsData = allContractsRes.ok ? await allContractsRes.json() : null;
      const activeContracts = contractsData?.count ?? contractsData?.contracts?.length ?? 0;
      const totalMissions = missionsData?.count ?? missionsData?.orders?.length ?? 0;
      const totalContracts = allContractsData?.count ?? allContractsData?.contracts?.length ?? 0;
      const projectedRevenue = activeContracts * 59.90;
      const defaultRate = totalContracts > 0 ? `${((totalContracts - activeContracts) / totalContracts * 100).toFixed(1)}%` : '0%';
      setStats({ activeContracts, totalMissions, projectedRevenue, defaultRate });
    } catch (err) {
      console.error('Erro ao carregar dados BI:', err);
      setStats({ activeContracts: 0, totalMissions: 0, projectedRevenue: 0, defaultRate: '0%' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Indicador', 'Valor'],
      ['Titulares Ativos', String(stats.activeContracts)],
      ['Ordens de Servico', String(stats.totalMissions)],
      ['MRR Projetado (R$)', stats.projectedRevenue.toFixed(2).replace('.', ',')],
      ['Taxa de Inadimplencia', stats.defaultRate],
    ];
    const csv = '\uFEFF' + rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eternityos_bi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess('Relatorio BI exportado em CSV.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400"><BarChart3 className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">Business Intelligence & Relatórios Executivos</h2>
              <p className="text-xs text-zinc-400">Indicadores de desempenho operacional, financeiro e atuarial</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="px-3 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Exportar BI
            </button>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-500 animate-pulse">Processando matriz de dados analíticos...</div>
          ) : stats.activeContracts === 0 && stats.totalMissions === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">Nenhum dado disponível. Cadastre contratos e ordens de serviço para visualizar os indicadores.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StatCard icon={<Users className="w-4 h-4 text-indigo-400" />} label="Titulares Ativos" value={String(stats.activeContracts)} color="text-slate-900 dark:text-white" />
                <StatCard icon={<Activity className="w-4 h-4 text-emerald-400" />} label="Ordens de Serviço" value={String(stats.totalMissions)} color="text-emerald-400" />
                <StatCard icon={<TrendingUp className="w-4 h-4 text-blue-400" />} label="MRR Projetado" value={`R$ ${stats.projectedRevenue.toFixed(2).replace('.', ',')}`} color="text-blue-400" />
                <StatCard icon={null} label="Taxa de Inadimplência" value={stats.defaultRate} color="text-amber-400" />
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-2">Distribuição de Sinistralidade e Custos Atuariais</h3>
                <p className="text-xs text-zinc-500 italic mt-3">* Dados atuariais serão populados quando houver registros financeiros suficientes.</p>
              </div>
            </>
          )}
        </div>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition">Fechar</button>
        </div>
      </div>
    </div>
  );
}
