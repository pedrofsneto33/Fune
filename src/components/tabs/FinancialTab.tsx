// Extraido de page.tsx (aba Financeiro). Livro Caixa:
// GET com filtros + POST novo lancamento + DELETE por linha.
// Fase 5b-1: transacoes (mutacao simples, sem dinheiro externo).
// Fase 5b-2: summary + reserves (somente leitura, secoes A e B no topo).
// READ-ONLY nas secoes novas — nenhum POST/DELETE.

'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { FinancialTransaction, FinancialSummary, RegulatoryReserve } from '@/types/domain';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifySuccess } from '@/lib/notify';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ReservePayload {
  success: boolean;
  data: RegulatoryReserve & { regulatoryBasis?: string };
}

function fmtBRL(v: number): string {
  return `R$ ${(Number(v) || 0).toFixed(2)}`;
}

export default function FinancialTab() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [reserve, setReserve] = useState<ReservePayload['data'] | null>(null);
  const [rows, setRows] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('500');
  const [modalOpen, setModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txCategory, setTxCategory] = useState('');
  const [txDate, setTxDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (type) params.set('type', type);
      if (category) params.set('category', category);
      if (limit) params.set('limit', limit);
      const res = await authFetch(`/api/financial/transactions?${params.toString()}`);
      const data = await res.json().catch(() => []);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      notifyError('Erro ao carregar lancamentos.');
    } finally {
      setLoading(false);
    }
  }, [from, to, type, category, limit]);

  useEffect(() => {
    load();
  }, [load]);

  // Secao A + B (5b-2, read-only): summary e reservas no mount.
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await authFetch('/api/financial/summary');
        const data = await res.json().catch(() => null);
        if (!cancel && data && typeof data.totalIncome === 'number') {
          setSummary(data as FinancialSummary);
        }
      } catch {
        if (!cancel) notifyError('Erro ao carregar resumo financeiro.');
      }
      try {
        const res = await authFetch('/api/financial/regulatory-reserves');
        const data = (await res.json().catch(() => null)) as ReservePayload | null;
        if (!cancel && data?.success && data.data) {
          setReserve(data.data);
        }
      } catch {
        if (!cancel) notifyError('Erro ao carregar reservas regulatorias.');
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);
  const handleCreate = async () => {
    if (!description.trim()) {
      notifyError('Descricao obrigatoria.');
      return;
    }
    if (!(Number(amount) > 0)) {
      notifyError('Valor deve ser maior que zero.');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/financial/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          amount: Number(amount),
          type: txType,
          category: txCategory.trim() || undefined,
          transaction_date: txDate || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notifyError(`Erro ao criar: ${(data as { error?: string }).error || 'Falha'}`);
        return;
      }
      notifySuccess('Lancamento criado.');
      setModalOpen(false);
      setDescription('');
      setAmount('');
      setTxCategory('');
      setTxDate('');
      await load();
    } catch {
      notifyError('Erro de conexao ao criar lancamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este lancamento?')) return;
    setDeletingId(id);
    try {
      const res = await authFetch(`/api/financial/transactions?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        notifyError(`Erro ao excluir: ${(data as { error?: string }).error || 'Falha'}`);
        return;
      }
      notifySuccess('Lancamento excluido.');
      await load();
    } catch {
      notifyError('Erro de conexao ao excluir.');
    } finally {
      setDeletingId(null);
    }
  };
  return (
    <div className="space-y-8 p-6">
      <section>
        <h2 className="text-lg font-bold text-white">Resumo financeiro</h2>
        <p className="text-xs text-slate-400">Fonte: GET /api/financial/summary (somente leitura).</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase text-slate-400">Receita total</p>
            <p className="text-xl font-bold text-emerald-400">{fmtBRL(summary?.totalIncome ?? 0)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase text-slate-400">Despesa total</p>
            <p className="text-xl font-bold text-red-400">{fmtBRL(summary?.totalExpense ?? 0)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase text-slate-400">Saldo</p>
            <p className="text-xl font-bold text-cyan-400">{fmtBRL(summary?.net ?? 0)}</p>
          </div>
        </div>
        {summary?.avulsoStats && (
          <p className="mt-2 text-xs text-slate-400">
            Avulsos: {summary.avulsoStats.count} cobranca(s), total {fmtBRL(summary.avulsoStats.total)}.
          </p>
        )}
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Receita vs Despesa (mes)</p>
          {!summary || summary.incomeByMonth.length === 0 ? (
            <p className="text-[11px] text-slate-500">Sem movimentacao financeira neste periodo.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={summary.incomeByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3a9', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3a9', fontSize: 10 }} tickFormatter={fmtBRL} />
                <Tooltip contentStyle={{ backgroundColor: '#0d121f', border: '1px solid #33415b', borderRadius: 6 }} formatter={(value: any) => [fmtBRL(Number(value)), '']} />
                <Legend wrapperStyle={{ color: '#94a3a9' }} />
                <Bar dataKey="income" name="Receitas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Despesas" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-white">Reservas regulatorias</h2>
        <p className="text-xs text-slate-400">Fonte: GET /api/financial/regulatory-reserves. Lei 13.261/2016.</p>
        {!reserve ? (
          <p className="mt-3 text-xs text-slate-400">Carregando reservas…</p>
        ) : (
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Mes: {reserve.referenceMonth}</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-200">{reserve.status}</span>
            </div>
            <p className="text-xs text-slate-300">
              Bruta: {fmtBRL(reserve.grossRevenue)} | Liquida: {fmtBRL(reserve.netRevenue)} |
              Aplicado: {fmtBRL(reserve.appliedAmount)}
            </p>
            {(['solvencia', 'tecnica'] as const).map((kind) => {
              const target = kind === 'solvencia' ? reserve.solvencyTarget : reserve.technicalTarget;
              const pct = target > 0 ? Math.min(100, (reserve.appliedAmount / target) * 100) : 0;
              return (
                <div key={kind}>
                  <p className="text-xs text-slate-400">
                    {kind === 'solvencia' ? 'Solvencia (meta 10% da bruta)' : 'Tecnica (meta 12% da liquida)'}: {fmtBRL(target)} — {pct.toFixed(1)}%
                  </p>
                  <div className="mt-1 h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <p className="text-[11px] text-slate-500">Exigencia minima: {fmtBRL(reserve.totalRequiredProvision)}.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-white">Livro Caixa</h2>
        <p className="text-xs text-slate-400">
          Fonte: GET /api/financial/transactions (filtros from/to/type/category/limit).
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-400">
            De
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="ml-1 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            />
          </label>
          <label className="text-xs text-slate-400">
            Ate
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="ml-1 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            />
          </label>
          <label className="text-xs text-slate-400">
            Tipo
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="ml-1 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            >
              <option value="">Todos</option>
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Categoria
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Opcional"
              className="ml-1 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            />
          </label>
          <label className="text-xs text-slate-400">
            Limite
            <input
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              inputMode="numeric"
              className="ml-1 w-20 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            />
          </label>
          <button
            onClick={() => setModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow"
          >
            Novo lancamento
          </button>
        </div>
        {loading ? (
          <p className="mt-3 text-xs text-slate-400">Carregando…</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full text-xs text-slate-200">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2 text-left">Descricao</th>
                  <th className="px-3 py-2 text-left">Categoria</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2 text-left">Acao</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-t border-slate-800">
                    <td className="px-3 py-2">{t.transaction_date || '—'}</td>
                    <td className="px-3 py-2">{t.description}</td>
                    <td className="px-3 py-2">{t.category || '—'}</td>
                    <td className="px-3 py-2">{t.type === 'income' ? 'Receita' : 'Despesa'}</td>
                    <td className="px-3 py-2 text-right">R$ {(Number(t.amount) || 0).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="px-2 py-1 bg-red-900/40 hover:bg-red-800/60 text-red-300 rounded text-xs"
                      >
                        {deletingId === t.id ? 'Excluindo…' : 'Excluir'}
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr className="border-t border-slate-800">
                    <td className="px-3 py-4 text-center text-slate-500" colSpan={6}>
                      Nenhum lancamento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Novo lancamento</h3>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descricao"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            />
            <div className="flex gap-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Valor"
                inputMode="decimal"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                placeholder="Categoria (opcional)"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-300 border border-slate-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold"
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}