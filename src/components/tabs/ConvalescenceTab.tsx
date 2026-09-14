'use client';

// Extraido de page.tsx (linhas ~3007-3075 + modal ~4539-4656).
// Resolvido quando o monolito for removido na Fase 6.

import React, { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifySuccess } from '@/lib/notify';
import type { ConvalescenceItem } from '@/types';

interface CatalogItem {
  id: string;
  name: string;
  status: string;
}

const DEFAULT_ITEMS = [
  { id: '', name: 'Cadeira de Rodas Dobrável', status: '' },
  { id: '', name: 'Cadeira de Banho', status: '' },
  { id: '', name: 'Par de Muletas Canadenses', status: '' },
  { id: '', name: 'Andador de Alumínio', status: '' },
  { id: '', name: 'Cama Hospitalar Articulada', status: '' },
];

const EMPTY_FORM = {
  item_name: 'Cadeira de Rodas Dobrável',
  holder_name: '',
  loan_date: '',
  expected_return_date: '',
};

export default function ConvalescenceTab() {
  const [loans, setLoans] = useState<ConvalescenceItem[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/convalescence');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (Array.isArray(data.items)) {
            setItems(
              data.items
                .filter((i: any) => i && i.id && i.name)
                .map((i: any) => ({ id: i.id, name: i.name, status: i.status })),
            );
          }
          if (Array.isArray(data.loans)) {
            setLoans(
              data.loans
                .filter((l: any) => l && l.id)
                .map((l: any) => ({
                  id: l.id,
                  item_id: l.item_id,
                  item_name: l.convalescence_items?.name || 'Item',
                  holder_name: l.holder_name || '',
                  loan_date: (l.created_at || '').slice(0, 10),
                  expected_return_date: l.expected_return_date || '',
                  status: l.status === 'Devolvido' ? 'Devolvido' : 'Ativo',
                })),
            );
          }
        }
      } else {
        const err = await res.json().catch(() => ({}));
        notifyError(err.error || 'Erro ao carregar convalescença');
      }
    } catch {
      notifyError('Erro de conexão ao carregar convalescença.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.holder_name || form.holder_name.trim().length < 3) {
      notifyError('Nome do associado é obrigatório (mínimo 3 caracteres).');
      return;
    }
    if (!form.expected_return_date) {
      notifyError('Informe a data prevista de devolução.');
      return;
    }
    setSaving(true);
    try {
      // Resolve o equipamento no catálogo (find-or-create)
      let item = items.find(
        (i) => i.name.toLowerCase() === form.item_name.toLowerCase(),
      );
      if (!item) {
        const cRes = await authFetch('/api/convalescence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ITEM', item_name: form.item_name }),
        });
        const cData = await cRes.json().catch(() => ({}));
        if (!cRes.ok || !cData?.item?.id) {
          throw new Error(cData.error || 'Falha ao cadastrar o equipamento.');
        }
        item = { id: cData.item.id, name: cData.item.name, status: cData.item.status };
        setItems((prev) => [...prev, item!]);
      }

      const res = await authFetch('/api/convalescence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOAN',
          item_id: item!.id,
          holder_name: form.holder_name,
          expected_return_date: form.expected_return_date,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data.error || 'Erro ao registrar o empréstimo.');
      }
      notifySuccess('Empréstimo convalescente registrado!');
      setIsNewOpen(false);
      setForm({ ...EMPTY_FORM });
      loadData();
    } catch (err) {
      notifyError('Erro: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async (c: ConvalescenceItem) => {
    if (!c.item_id) {
      notifyError('Empréstimo sem item associado — atualize a página.');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/convalescence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RETURN',
          loan_id: c.id,
          item_id: c.item_id,
          return_condition: 'Bom',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data.error || 'Erro ao dar baixa no empréstimo.');
      }
      notifySuccess('Empréstimo devolvido!');
      loadData();
    } catch (err) {
      notifyError('Erro: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const selectItems =
    items.length > 0
      ? Array.from(new Map(items.map((i) => [i.name, i])).values())
      : DEFAULT_ITEMS;

  return (
    <div className="space-y-4">
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Central de Empréstimo Convalescente
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            Empréstimo gratuito de equipamentos ortopédicos
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ ...EMPTY_FORM });
            setIsNewOpen(true);
          }}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow"
        >
          + Novo Empréstimo
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : loans.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum empréstimo registrado.</p>
      ) : (
        <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Equipamento</th>
                <th className="py-3 px-4">Associado</th>
                <th className="py-3 px-4">Data Empréstimo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-700 dark:text-slate-200">
              {loans.map((c) => (
                <tr key={c.id} className="hover:bg-slate-200 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-bold text-emerald-400">{c.item_name}</td>
                  <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">
                    {c.holder_name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-500">
                    {c.loan_date}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'Ativo'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-500'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {c.status === 'Ativo' ? (
                      <button
                        onClick={() => handleReturn(c)}
                        disabled={saving}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-white rounded text-[11px] disabled:opacity-50"
                      >
                        {saving ? '...' : 'Dar Baixa'}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">Devolvido</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isNewOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-white shadow-2xl">
            <h3 className="font-bold text-sm text-emerald-400 mb-4">
              + Registrar Empréstimo Convalescente
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Equipamento:
                </label>
                <select
                  value={form.item_name}
                  onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                >
                  {selectItems.map((opt) => (
                    <option key={opt.name} value={opt.name}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Associado / Titular Beneficiado:
                </label>
                <input
                  type="text"
                  value={form.holder_name}
                  onChange={(e) => setForm({ ...form, holder_name: e.target.value })}
                  placeholder="Nome do associado..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Data do Empréstimo:
                </label>
                <input
                  type="date"
                  value={form.loan_date}
                  onChange={(e) => setForm({ ...form, loan_date: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Devolução prevista (obrigatório):
                </label>
                <input
                  type="date"
                  required
                  value={form.expected_return_date}
                  onChange={(e) =>
                    setForm({ ...form, expected_return_date: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsNewOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-emerald-600 font-bold rounded text-white disabled:opacity-50"
                >
                  {saving ? 'Registrando...' : 'Confirmar Empréstimo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}