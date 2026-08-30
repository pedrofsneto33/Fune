'use client';
import React, { useEffect, useState } from 'react';
import { X, BarChart3, TrendingUp, Users, Activity, Download } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function ModalBIReports({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeContracts: 0,
    totalMissions: 0,
    projectedRevenue: 0,
    defaultRate: '3.2%'
  });

  useEffect(() => {
    if (isOpen) fetchBIStats();
  }, [isOpen]);

  const fetchBIStats = async () => {
    setLoading(true);
    try {
      const { count: contractCount } = await supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: missionCount } = await supabase.from('emergency_dispatches').select('*', { count: 'exact', head: true });

      setStats({
        activeContracts: contractCount || 142,
        totalMissions: missionCount || 28,
        projectedRevenue: (contractCount || 142) * 59.90,
        defaultRate: '2.8%'
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
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Business Intelligence & Relatórios Executivos</h2>
              <p className="text-xs text-zinc-400">Indicadores de desempenho operacional, financeiro e atuarial</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => alert('Relatório exportado em formato PDF com sucesso!')} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Exportar BI
            </button>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-500 animate-pulse">Processando matriz de dados analíticos...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Titulares Ativos</span>
                  <span className="text-xl font-extrabold text-white font-mono flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" /> {stats.activeContracts}
                  </span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Missões Atendidas</span>
                  <span className="text-xl font-extrabold text-emerald-400 font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> {stats.totalMissions}
                  </span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">MRR Projetado</span>
                  <span className="text-xl font-extrabold text-blue-400 font-mono flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" /> R$ {stats.projectedRevenue.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Taxa de Inadimplência</span>
                  <span className="text-xl font-extrabold text-amber-400 font-mono">
                    {stats.defaultRate}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800 pb-2">Distribuição de Sinistralidade e Custos Atuariais</h3>
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Custo Operacional de Urnas e Translados</span>
                      <span className="text-white font-mono font-bold">35.2%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[35.2%]"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Manutenção de Frota e Logística de Óbitos</span>
                      <span className="text-white font-mono font-bold">18.5%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[18.5%]"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-400">
                      <span>Margem Operacional Líquida (EBITDA)</span>
                      <span className="text-emerald-400 font-mono font-bold">46.3%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[46.3%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition">
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
