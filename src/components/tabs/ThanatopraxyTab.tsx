'use client';

// Extraido de page.tsx (~2613).
// Resolvido quando o monolito for removido na Fase 6.

import React, { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifyInfo } from '@/lib/notify';
import type { Thanatopraxy } from '@/types';

const EMPTY_FORM = {
  deceased_name: '',
  technician: 'Dr. Roberto Tanatólogo',
  procedure: 'Aspiração e Formolização Padrão',
};

export default function ThanatopraxyTab() {
  const [records, setRecords] = useState<Thanatopraxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/thanatopraxy');
      const data = await res.json().catch(() => []);
      if (res.ok) setRecords(Array.isArray(data) ? data : []);
      else notifyError(data.error || 'Erro ao carregar tanatopraxia');
    } catch {
      notifyError('Erro de conexão ao carregar tanatopraxia.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deceased_name || form.deceased_name.trim().length < 2) {
      notifyError('Nome do falecido é obrigatório (mínimo 2 caracteres).');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/thanatopraxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newRecord = await res.json();
        setRecords((prev) => [newRecord, ...prev]);
        setIsNewOpen(false);
        setForm({ ...EMPTY_FORM });
        notifyInfo('Procedimento de tanatopraxia registrado!');
      } else {
        const err = await res.json();
        notifyError(`Erro: ${err.error || 'Falha ao salvar procedimento'}`);
      }
    } catch {
      notifyError('Erro de conexão ao salvar procedimento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Laboratório de Tanatopraxia
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            {records.length} procedimento(s) registrado(s)
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ ...EMPTY_FORM });
            setIsNewOpen(true);
          }}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow"
        >
          + Novo Procedimento
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum procedimento registrado.</p>
      ) : (
        <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Falecido</th>
                <th className="py-3 px-4">Tanatólogo</th>
                <th className="py-3 px-4">Procedimento</th>
                <th className="py-3 px-4">Conclusão</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-700 dark:text-slate-200">
              {records.map((t) => (
                <tr key={t.id} className="hover:bg-slate-200 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {t.deceased_name}
                  </td>
                  <td className="py-3 px-4 text-purple-400 font-semibold">
                    {t.technician}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {t.procedure}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-500">
                    {t.completed_at
                      ? new Date(t.completed_at).toLocaleString('pt-BR')
                      : 'Concluído'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                      ✅ {t.status || 'Concluído'}
                    </span>
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
              + Registrar Procedimento de Tanatopraxia
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
                  Tanatólogo Responsável:
                </label>
                <input
                  type="text"
                  value={form.technician}
                  onChange={(e) => setForm({ ...form, technician: e.target.value })}
                  placeholder="Dr. Roberto Tanatólogo"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Procedimento Realizado:
                </label>
                <input
                  type="text"
                  value={form.procedure}
                  onChange={(e) => setForm({ ...form, procedure: e.target.value })}
                  placeholder="Aspiração e Formolização Padrão"
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
                  className="px-4 py-1.5 bg-purple-600 font-bold rounded text-white disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Registrar Procedimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}