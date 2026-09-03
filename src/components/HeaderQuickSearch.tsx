'use client';


import { notifySuccess, notifyError, notifyInfo } from '@/lib/notify';
import React, { useState } from 'react';

interface HolderSearchResult {
  id: string;
  full_name: string;
  cpf: string;
  phone: string;
  contracts?: Array<{
    id: string;
    status: string;
    plans?: { name: string; description?: string };
  }>;
  dependents?: Array<{ id: string; full_name: string; relation: string }>;
}

export function HeaderQuickSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HolderSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHolder, setSelectedHolder] = useState<HolderSearchResult | null>(null);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.trim().length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/holders/quick-search?q=${encodeURIComponent(val)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('supabase_token') || ''}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="🚨 Consulta Rápida: Digite CPF ou Nome do Associado..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
        />
        <span className="absolute left-3 text-slate-600 dark:text-slate-500 dark:text-slate-400">🔍</span>
        {loading && <span className="absolute right-3 text-xs text-blue-400 animate-pulse">Buscando...</span>}
      </div>

      {results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden">
          {results.map((holder) => {
            const contract = holder.contracts?.[0];
            const isActive = contract?.status === 'active';
            return (
              <div
                key={holder.id}
                onClick={() => {
                  setSelectedHolder(holder);
                  setResults([]);
                }}
                className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 border-b border-slate-200 dark:border-slate-800 cursor-pointer transition-colors flex items-center justify-between text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{holder.full_name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-500 dark:text-slate-400">CPF: {holder.cpf} • Plano: {contract?.plans?.name || 'Sem plano'}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                    isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {isActive ? '✓ Coberto / Ativo' : '⚠ Pendente'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {selectedHolder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl max-w-lg w-full p-6 text-slate-900 dark:text-white shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedHolder.full_name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-500 dark:text-slate-400">CPF: {selectedHolder.cpf} • Tel: {selectedHolder.phone}</p>
              </div>
              <button
                onClick={() => setSelectedHolder(null)}
                className="text-slate-600 dark:text-slate-500 dark:text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="bg-slate-200 dark:bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                <span>Plano Contratado:</span>
                <span className="font-semibold text-blue-400">{selectedHolder.contracts?.[0]?.plans?.name || 'Nenhum'}</span>
              </div>

              <div>
                <p className="font-semibold text-xs text-slate-600 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Dependentes Cobertos ({selectedHolder.dependents?.length || 0}):</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {(selectedHolder.dependents || []).map((dep) => (
                    <div key={dep.id} className="text-xs bg-slate-50 dark:bg-slate-950 p-2 rounded flex justify-between">
                      <span>{dep.full_name}</span>
                      <span className="text-slate-600 dark:text-slate-500">({dep.relation})</span>
                    </div>
                  ))}
                  {(!selectedHolder.dependents || selectedHolder.dependents.length === 0) && (
                    <p className="text-xs text-slate-600 dark:text-slate-500">Nenhum dependente cadastrado.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedHolder(null)}
                className="px-4 py-2 text-xs text-slate-600 dark:text-slate-500 dark:text-slate-400 hover:text-white rounded bg-slate-200 dark:bg-slate-800"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  notifyInfo(`Iniciando atendimento para ${selectedHolder.full_name}`);
                  setSelectedHolder(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white dark:text-white rounded shadow"
              >
                🚨 Iniciar Atendimento / Óbito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
