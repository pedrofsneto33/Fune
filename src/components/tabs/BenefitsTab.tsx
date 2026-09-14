'use client';

// Duplicacao temporaria de src/app/page.tsx (benefits UI, ~linha 3081).
// Resolvida quando o monolito for removido na Fase 6.

import React, { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifyInfo, notifySuccess } from '@/lib/notify';
import type { Partner } from '@/types';

const EMPTY_FORM = {
  partner_name: '',
  category: 'Medicamentos & Farmácia',
  discount_percentage: 20,
  contact_info: '',
};

export default function BenefitsTab() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/benefits/partners');
      const data = await res.json().catch(() => []);
      if (res.ok) setPartners(Array.isArray(data) ? data : []);
      else notifyError(data.error || 'Erro ao carregar parceiros');
    } catch {
      notifyError('Erro de conexão ao carregar parceiros.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setIsNewOpen(true);
  };

  const openEdit = (p: Partner) => {
    setForm({
      partner_name: p.partner_name,
      category: p.category,
      discount_percentage: p.discount_percentage,
      contact_info: p.contact_info,
    });
    setEditingId(p.id);
    setIsNewOpen(true);
  };

  const closeModal = () => {
    setIsNewOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.partner_name || form.partner_name.trim().length < 2) {
      notifyError('Nome do parceiro é obrigatório (mínimo 2 caracteres).');
      return;
    }
    const pct = Number(form.discount_percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      notifyError('% de desconto deve ser entre 0 e 100.');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/benefits/partners', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ...(editingId ? { id: editingId } : {}),
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        if (editingId) {
          setPartners((prev) => prev.map((p) => (p.id === editingId ? saved : p)));
          notifySuccess('Parceiro atualizado com sucesso!');
        } else {
          setPartners((prev) => [...prev, saved]);
          notifySuccess('Parceiro credenciado com sucesso!');
        }
        closeModal();
        loadPartners();
      } else {
        const err = await res.json();
        notifyError(`Erro: ${err.error || 'Falha ao salvar parceiro'}`);
      }
    } catch {
      notifyError('Erro de conexão ao salvar parceiro.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este parceiro da rede de convênios?')) return;
    try {
      const res = await authFetch(
        `/api/benefits/partners?id=${encodeURIComponent(id)}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        setPartners((prev) => prev.filter((p) => p.id !== id));
        notifyInfo('Parceiro removido.');
      } else {
        const err = await res.json();
        notifyError(`Erro: ${err.error || 'Falha ao remover parceiro'}`);
      }
    } catch {
      notifyError('Erro de conexão ao remover parceiro.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Rede Conveniada & Clube de Benefícios
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            Parceiros com descontos exclusivos para associados
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow"
        >
          + Novo Parceiro
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : partners.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum parceiro cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {partners.map((p) => (
            <div
              key={p.id}
              className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex justify-between items-start"
            >
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase">
                  {p.category}
                </span>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                  {p.partner_name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-500 mt-1">
                  Contato: {p.contact_info}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
                  {p.discount_percentage}% OFF
                </span>
                <button
                  onClick={() => openEdit(p)}
                  className="p-1 text-sky-400 hover:bg-sky-500/10 rounded"
                  title="Editar parceiro"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1 text-rose-400 hover:bg-rose-500/10 rounded"
                  title="Excluir parceiro"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isNewOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
          <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-white shadow-2xl">
            <h3 className="font-bold text-sm text-cyan-400 mb-4">
              {editingId ? 'Editar Parceiro' : '+ Credenciar Novo Parceiro'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Nome da Empresa / Parceiro:
                </label>
                <input
                  type="text"
                  value={form.partner_name}
                  onChange={(e) => setForm({ ...form, partner_name: e.target.value })}
                  placeholder="ex: Óptica Central"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                    Categoria:
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="ex: Farmácia, Óptica..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                    % de Desconto:
                  </label>
                  <input
                    type="number"
                    value={form.discount_percentage}
                    onChange={(e) =>
                      setForm({ ...form, discount_percentage: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-500 font-semibold mb-1">
                  Telefone / Contato:
                </label>
                <input
                  type="text"
                  value={form.contact_info}
                  onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
                  placeholder="(86) 3000-0000"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded text-xs font-bold"
                >
                  {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Credenciar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}