// API orfa — UI nova criada na Fase 5c-1 (nao existe codigo em page.tsx
// para copiar). Contas a pagar: GET lista + POST nova + PATCH edicao.
// Regra "copiar nao mover" nao se aplica aqui.

'use client';

import React, { useEffect, useState } from 'react';
import { AccountPayable } from '@/types/domain';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifySuccess } from '@/lib/notify';

const EMPTY = { description: '', amount: '', due_date: '', status: 'pendente', payment_method: '', notes: '' };

export default function AccountsPayableTab() {
  const [rows, setRows] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AccountPayable | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/accounts-payable');
      const data = await res.json().catch(() => []);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      notifyError('Erro ao carregar contas a pagar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (row: AccountPayable) => {
    setEditing(row);
    setForm({
      description: row.description,
      amount: String(row.amount ?? ''),
      due_date: (row.due_date || '').slice(0, 10),
      status: row.status,
      payment_method: row.payment_method || '',
      notes: row.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.description.trim()) {
      notifyError('Descricao obrigatoria.');
      return;
    }
    if (!(Number(form.amount) > 0)) {
      notifyError('Valor deve ser maior que zero.');
      return;
    }
    if (!form.due_date) {
      notifyError('Vencimento obrigatorio.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        description: form.description.trim(),
        amount: Number(form.amount),
        due_date: form.due_date,
        status: form.status,
        payment_method: form.payment_method.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      const res = editing
        ? await authFetch(`/api/accounts-payable?id=${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await authFetch('/api/accounts-payable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notifyError(`Erro ao salvar: ${(data as { error?: string }).error || 'Falha'}`);
        return;
      }
      notifySuccess(editing ? 'Conta atualizada.' : 'Conta criada.');
      setModalOpen(false);
      await load();
    } catch {
      notifyError('Erro de conexao ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-8 p-6">
      <section>
        <h2 className="text-lg font-bold text-white">Contas a pagar</h2>
        <p className="text-xs text-slate-400">Fonte: GET /api/accounts-payable (ordenado por vencimento).</p>
        <button
          onClick={openCreate}
          className="mt-3 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow"
        >
          Nova conta
        </button>
        {loading ? (
          <p className="mt-3 text-xs text-slate-400">Carregando…</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full text-xs text-slate-200">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Vencimento</th>
                  <th className="px-3 py-2 text-left">Descricao</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Metodo</th>
                  <th className="px-3 py-2 text-left">Acao</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-800">
                    <td className="px-3 py-2">{(r.due_date || '').slice(0, 10) || '—'}</td>
                    <td className="px-3 py-2">{r.description}</td>
                    <td className="px-3 py-2 text-right">R$ {(Number(r.amount) || 0).toFixed(2)}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.payment_method || '—'}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr className="border-t border-slate-800">
                    <td className="px-3 py-4 text-center text-slate-500" colSpan={6}>
                      Nenhuma conta encontrada.
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
            <h3 className="text-sm font-bold text-white">{editing ? 'Editar conta' : 'Nova conta'}</h3>
            <input
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descricao"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            />
            <div className="flex gap-2">
              <input
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="Valor"
                inputMode="decimal"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <input
                value={form.payment_method}
                onChange={(e) => set('payment_method', e.target.value)}
                placeholder="Metodo (opcional)"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
            <input
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Observacoes (opcional)"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-300 border border-slate-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
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
