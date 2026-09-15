'use client';

// Extraido de page.tsx (~2544). CRUD completo.
// Resolvido quando o monolito for removido na Fase 6.

import React, { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifySuccess } from '@/lib/notify';
import type { Burial } from '@/types';
import BurialGuide from '@/components/print/BurialGuide';

const EMPTY_FORM = {
  id: '',
  deceased_name: '',
  burial_date: '',
  cemetery_location: '',
  status: 'Agendado',
};

export default function BurialsTab() {
  const [burials, setBurials] = useState<Burial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  // Impressao (6g-5): sepultamento cuja Guia esta aberta
  const [printBurial, setPrintBurial] = useState<Burial | null>(null);

  const loadBurials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/chapel/burials');
      const data = await res.json().catch(() => []);
      if (res.ok) setBurials(Array.isArray(data) ? data : []);
      else notifyError(data.error || 'Erro ao carregar sepultamentos');
    } catch {
      notifyError('Erro de conexão ao carregar sepultamentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBurials();
  }, [loadBurials]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
  };

  const openNew = () => {
    resetForm();
    setIsNewOpen(true);
  };

  const openEdit = (b: Burial) => {
    setForm({
      id: b.id,
      deceased_name: b.deceased_name,
      burial_date: b.burial_date ? b.burial_date.slice(0, 10) : '',
      cemetery_location: b.cemetery_location || '',
      status: b.status || 'Agendado',
    });
    setEditingId(b.id);
    setIsNewOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deceased_name || form.deceased_name.trim().length < 2) {
      notifyError('Nome do falecido é obrigatório (mínimo 2 caracteres).');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        // PATCH
        const res = await authFetch('/api/chapel/burials', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const updated = await res.json();
          setBurials((prev) => prev.map((b) => (b.id === editingId ? updated : b)));
          setIsNewOpen(false);
          resetForm();
          notifySuccess('Sepultamento atualizado.');
        } else {
          const err = await res.json();
          notifyError(`Erro: ${err.error || 'Falha ao atualizar sepultamento'}`);
        }
      } else {
        // POST (o backend força status 'Agendado')
        const res = await authFetch('/api/chapel/burials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const created = await res.json();
          setBurials((prev) => [created, ...prev]);
          setIsNewOpen(false);
          resetForm();
          notifySuccess('Sepultamento registrado!');
        } else {
          const err = await res.json();
          notifyError(`Erro: ${err.error || 'Falha ao registrar sepultamento'}`);
        }
      }
    } catch {
      notifyError('Erro de conexão ao salvar sepultamento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            ⚰️ Sepultamentos
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            {burials.length} sepultamento(s) registrado(s)
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow"
        >
          + Novo Sepultamento
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : burials.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum sepultamento registrado.</p>
      ) : (
        <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4">Falecido</th>
                <th className="py-3 px-4">Cemiterio</th>
                <th className="py-3 px-4">Data/Hora</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-700 dark:text-slate-200">
              {burials.map((b) => (
                <tr key={b.id} className="hover:bg-slate-200 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 dark:text-white">{b.deceased_name}</span>
                  </td>
                  <td className="py-3 px-4">{b.cemetery_location || '—'}</td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {new Date(b.burial_date).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px] font-bold">
                      {b.status || 'Agendado'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setPrintBurial(b)}
                      className="mr-1 px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-700 text-[11px] font-semibold"
                    >
                      🖨️ Guia
                    </button>
                    <button
                      onClick={() => openEdit(b)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold"
                    >
                      ✏️ Editar
                    </button>
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
            <h3 className="font-bold text-sm text-purple-400 mb-4">
              {editingId ? '✏️ Editar Sepultamento' : '+ Novo Sepultamento'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Nome do Falecido:
                </label>
                <input
                  type="text"
                  value={form.deceased_name}
                  onChange={(e) => setForm({ ...form, deceased_name: e.target.value })}
                  placeholder="Nome completo do falecido"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Data do Sepultamento:
                </label>
                <input
                  type="date"
                  value={form.burial_date}
                  onChange={(e) => setForm({ ...form, burial_date: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Cemitério:
                </label>
                <input
                  type="text"
                  value={form.cemetery_location}
                  onChange={(e) => setForm({ ...form, cemetery_location: e.target.value })}
                  placeholder="Cemitério Municipal"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Status:
                </label>
                <select
                  value={form.status || 'Agendado'}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                >
                  <option value="Agendado">Agendado</option>
                  <option value="Realizado">Realizado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewOpen(false);
                    resetForm();
                  }}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-purple-600 font-bold rounded text-white disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Registrar Sepultamento')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Impressão da Guia de Sepultamento (6g-5) */}
      {printBurial && (
        <BurialGuide burial={printBurial} onClose={() => setPrintBurial(null)} />
      )}
    </div>
  );
}