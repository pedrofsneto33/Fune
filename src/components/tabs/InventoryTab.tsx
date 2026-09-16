'use client';

// Extraido de page.tsx (~2918).
// Resolvido quando o monolito for removido na Fase 6.

import React, { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifyInfo } from '@/lib/notify';
import type { InventoryItem } from '@/types';

const EMPTY_FORM = {
  item_name: '',
  category: 'Urna Adulto',
  stock_quantity: 10,
  min_threshold: 3,
};

export default function InventoryTab() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/inventory');
      const data = await res.json().catch(() => []);
      if (res.ok) setItems(Array.isArray(data) ? data : []);
      else notifyError(data.error || 'Erro ao carregar estoque');
    } catch {
      notifyError('Erro de conexão ao carregar estoque.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleAdjustStock = async (item: InventoryItem, delta: number) => {
    if (pendingId === item.id) return;
    const next = Math.max(0, item.stock_quantity + delta);
    if (next === item.stock_quantity) return;
    const prev = item.stock_quantity;
    setPendingId(item.id);
    setItems((list) =>
      list.map((i) => (i.id === item.id ? { ...i, stock_quantity: next } : i)),
    );
    try {
      const res = await authFetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, stock_quantity: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setItems((list) =>
          list.map((i) => (i.id === item.id ? { ...i, stock_quantity: prev } : i)),
        );
        notifyError(`Erro: ${err.error || 'Falha ao ajustar estoque'}`);
      }
    } catch {
      setItems((list) =>
        list.map((i) => (i.id === item.id ? { ...i, stock_quantity: prev } : i)),
      );
      notifyError('Erro de conexão ao ajustar estoque.');
    } finally {
      setPendingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item_name || form.item_name.trim().length < 2) {
      notifyError('Nome do item é obrigatório (mínimo 2 caracteres).');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newItem = await res.json();
        setItems((prev) => [...prev, newItem]);
        setIsNewOpen(false);
        setForm({ ...EMPTY_FORM });
        notifyInfo('Item cadastrado no estoque!');
      } else {
        const err = await res.json();
        notifyError(`Erro: ${err.error || 'Falha ao salvar item'}`);
      }
    } catch {
      notifyError('Erro de conexão ao salvar item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Inventário de Urnas & Insumos
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            Controle de saldo, entrada e saída em 1 clique
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ ...EMPTY_FORM });
            setIsNewOpen(true);
          }}
          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow"
        >
          + Novo Item
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum item cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between"
            >
              <div>
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase">
                  {item.category}
                </p>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                  {item.item_name}
                </h4>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {item.stock_quantity} un
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-600 dark:text-slate-500">
                  Mínimo: {item.min_threshold} un
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAdjustStock(item, -1)}
                    disabled={pendingId === item.id || item.stock_quantity <= 0}
                    className="w-7 h-7 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded flex items-center justify-center text-xs disabled:opacity-50"
                    title="Dar baixa (-1)"
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleAdjustStock(item, 1)}
                    disabled={pendingId === item.id}
                    className="w-7 h-7 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center justify-center text-xs disabled:opacity-50"
                    title="Adicionar (+1)"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isNewOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-white shadow-2xl">
            <h3 className="font-bold text-sm text-amber-400 mb-4">+ Cadastrar Novo Item</h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Nome do Item:
                </label>
                <input
                  type="text"
                  value={form.item_name}
                  onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                  placeholder="ex: Urna Adulto Madeira"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Categoria:
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="ex: Urna Adulto"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                    Quantidade Inicial:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                    Estoque Mínimo:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_threshold}
                    onChange={(e) => setForm({ ...form, min_threshold: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
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
                  className="px-4 py-1.5 bg-amber-600 font-bold rounded text-white disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}