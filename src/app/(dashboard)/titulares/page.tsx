'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifyInfo } from '@/lib/notify';
import type { ContractPlan, Contract, Dependent, Holder, StatusFilter } from '@/types';

export default function TitularesPage() {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [quickResults, setQuickResults] = useState<Holder[]>([]);
  const [quickLoading, setQuickLoading] = useState(false);

  // GET /api/holders — lista completa do tenant (mesmo contrato de page.tsx loadData)
  const loadHolders = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/holders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setHolders(data);
      } else {
        const j = await res.json().catch(() => ({}));
        notifyError('Erro ao carregar titulares: ' + (j.error || 'falha'));
      }
    } catch {
      notifyError('Erro de conexão ao carregar titulares.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolders();
  }, []);

  // GET /api/holders/quick-search — busca server-side (>= 3 chars, até 5 resultados).
  // Debounce de 300ms para respeitar o rate limit do endpoint (60/min por usuário).
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setQuickResults([]);
      setQuickLoading(false);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setQuickLoading(true);
      try {
        const res = await authFetch(
          '/api/holders/quick-search?q=' + encodeURIComponent(q),
        );
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setQuickResults(Array.isArray(data) ? data : []);
        } else {
          setQuickResults([]);
        }
      } catch {
        if (!cancelled) setQuickResults([]);
      } finally {
        if (!cancelled) setQuickLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery]);

  // Cópia fiel de page.tsx (linhas 700-723): filtragem com normalização de acentos
  const filteredHolders = useMemo(() => {
    return holders.filter((h) => {
      const q = searchQuery.toLowerCase().trim();
      const onlyNums = q.replace(/\D/g, '');
      const norm = (s: string | undefined) =>
        (s || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
      const matchQ =
        !q ||
        norm(h.full_name).includes(norm(q)) ||
        h.cpf?.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        (h.phone && h.phone.replace(/\D/g, '').includes(onlyNums)) ||
        norm(h.city).includes(norm(q)) ||
        norm(h.state).includes(norm(q));

      const rawStatus = h.status || h.contracts?.[0]?.status || 'ativo';
      const status =
        rawStatus === 'inactive' || rawStatus === 'inativo' ? 'inativo' : 'ativo';
      const matchS = statusFilter === 'all' || status === statusFilter;

      return matchQ && matchS;
    });
  }, [holders, searchQuery, statusFilter]);

  // Cópia fiel de page.tsx (linhas 725-741): export CSV com BOM UTF-8
  const handleExportCSV = () => {
    if (holders.length === 0) return notifyInfo('Nenhum associado para exportar.');
    let csv = 'Nome;CPF;Telefone;Email;Endereco;Status;Plano\n';
    holders.forEach((h) => {
      const plan = h.contracts?.[0]?.plans?.name || 'Familiar Ouro';
      const status = h.status === 'inativo' ? 'Inativo' : 'Ativo';
      csv += `"${h.full_name}";"${h.cpf}";"${h.phone}";"${h.email || ''}";"${h.address || ''}";"${status}";"${plan}"\n`;
    });
    // BOM UTF-8: Excel no Windows assume ANSI sem ele e acentos viram "?"
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `associados_eternityos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const statusOf = (h: Holder) => {
    const raw = h.status || h.contracts?.[0]?.status || 'ativo';
    return raw === 'inactive' || raw === 'inativo' ? 'inativo' : 'ativo';
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho da página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Gestão de Titulares — Listagem (leitura)
          </h2>
          <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-0.5">
            {loading
              ? 'Carregando titulares...'
              : `${holders.length} titulares · ${filteredHolders.length} no filtro atual`}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition shadow shrink-0"
        >
          ⬇️ Exportar CSV
        </button>
      </div>

      {/* Busca + filtro de status (cópia do padrão da aba de page.tsx) */}
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Buscar por nome, CPF, cidade..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 sm:py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="w-full sm:w-36 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 sm:py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>
      </div>

      {/* Resultados da busca rápida server-side (quick-search, >= 3 chars) */}
      {searchQuery.trim().length >= 3 && (
        <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">
            Busca rápida no servidor {quickLoading ? '· buscando…' : `· ${quickResults.length} resultado(s)`}
          </p>
          {!quickLoading && quickResults.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhum resultado do servidor.</p>
          ) : (
            <div className="space-y-1">
              {quickResults.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5"
                >
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {h.full_name}
                  </span>
                  <span className="text-slate-500 shrink-0">
                    {h.cpf} · {statusOf(h)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabela de listagem (leitura — sem ações de mutação na 2a) */}
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 uppercase text-[11px]">
              <th className="py-3 px-4">Titular</th>
              <th className="py-3 px-4">CPF</th>
              <th className="py-3 px-4">Telefone</th>
              <th className="py-3 px-4">Plano</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Dependentes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-6 px-4 text-center text-slate-500">
                  Carregando titulares...
                </td>
              </tr>
            ) : filteredHolders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 px-4 text-center text-slate-500">
                  Nenhum titular encontrado para o filtro atual.
                </td>
              </tr>
            ) : (
              filteredHolders.map((h) => {
                const contract = h.contracts?.[0];
                const planName = contract?.plans?.name || 'Familiar Ouro';
                const status = statusOf(h);
                return (
                  <tr key={h.id} className="hover:bg-slate-100 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {h.full_name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{h.cpf}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{h.phone}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{planName}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          status === 'ativo'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                      {(h.dependents || []).length}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}