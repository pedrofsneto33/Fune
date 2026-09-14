// Extraido de page.tsx (aba Financeiro). Livro Caixa:
// GET com filtros + POST novo lancamento + DELETE por linha.
// Fase 5b-1: transacoes (mutacao simples, sem dinheiro externo).
// Fase 5b-2: summary + reserves (somente leitura).

'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { FinancialTransaction } from '@/types/domain';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifySuccess } from '@/lib/notify';

export default function FinancialTab() {
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