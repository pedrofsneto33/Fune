'use client';
import React, { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { authFetch } from '@/lib/authFetch';

interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  monthlyData: { month: string; income: number; expense: number }[];
  categoryData: { name: string; value: number }[];
}

export function ModalDRE({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/financial/dre?year=${year}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error('Erro ao carregar DRE:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">DRE - Demonstração de Resultados</h2>
              <p className="text-xs text-zinc-400">Análise financeira detalhada</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="text-center text-xs text-zinc-500 py-12 animate-pulse">Carregando dados financeiros...</div>
          ) : data ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Receita Total</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-400">R$ {data.totalIncome.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-red-400" />
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Despesa Total</span>
                  </div>
                  <p className="text-xl font-bold text-red-400">R$ {data.totalExpense.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Lucro Líquido</span>
                  </div>
                  <p className={`text-xl font-bold ${data.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>R$ {data.netProfit.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4">Evolução Mensal</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="income" fill="#10b981" name="Receita" />
                    <Bar dataKey="expense" fill="#ef4444" name="Despesa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4">Despesas por Categoria</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {data.categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #374151', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="text-center text-xs text-zinc-500 py-12">Nenhum dado financeiro encontrado.</div>
          )}
        </div>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition">Fechar</button>
        </div>
      </div>
    </div>
  );
}
