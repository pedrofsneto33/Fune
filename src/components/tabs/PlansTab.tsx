'use client';

import { useEffect, useState } from 'react';
import { Package, Plus, Pencil, Trash2 } from 'lucide-react';
import { notifySuccess, notifyError, notifyInfo } from '@/lib/notify';
import { authFetch } from '@/lib/authFetch';

type Plan = {
  id: string;
  name: string;
  monthly_fee: number;
  max_dependents: number;
  description: string | null;
  commission_rate_initial?: number | null;
  commission_rate_recurring?: number | null;
};

const EMPTY_FORM = {
  name: '',
  monthly_fee: '',
  max_dependents: 5,
  description: '',
  commission_rate_initial: '',
  commission_rate_recurring: '',
};

const fmtBrl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

export default function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({ ...EMPTY_FORM });
  const [savingPlan, setSavingPlan] = useState(false);
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/plans');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPlans(data);
      } else {
        notifyError('Erro ao carregar planos.');
      }
    } catch {
      notifyError('Erro de conexão ao carregar planos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim() || !planForm.monthly_fee) {
      notifyInfo('Nome e mensalidade são obrigatórios.');
      return;
    }
    setSavingPlan(true);
    try {
      const url = editingPlan ? `/api/plans?id=${editingPlan}` : '/api/plans';
      const res = await authFetch(url, {
        method: editingPlan ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planForm.name.trim(),
          monthly_fee: Number(planForm.monthly_fee),
          max_dependents: Number(planForm.max_dependents) || 5,
          description: planForm.description.trim() || null,
          commission_rate_initial:
            planForm.commission_rate_initial === '' ? 0 : Number(planForm.commission_rate_initial),
          commission_rate_recurring:
            planForm.commission_rate_recurring === ''
              ? 0
              : Number(planForm.commission_rate_recurring),
        }),
      });
      if (res.ok) {
        notifySuccess(editingPlan ? 'Plano atualizado!' : 'Plano criado!');
        setEditingPlan(null);
        setPlanForm({ ...EMPTY_FORM });
        setIsNewPlanOpen(false);
        loadPlans();
      } else {
        const d = await res.json().catch(() => ({}));
        notifyError(d.error || 'Erro ao salvar plano.');
      }
    } catch {
      notifyError('Erro de conexão ao salvar plano.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!window.confirm(`Excluir o plano "${planName}"? Contratos vinculados serão bloqueados.`))
      return;
    try {
      const res = await authFetch(`/api/plans?id=${planId}`, { method: 'DELETE' });
      if (res.ok) {
        notifySuccess('Plano excluído.');
        loadPlans();
      } else {
        const d = await res.json().catch(() => ({}));
        notifyError(d.error || 'Erro ao excluir plano. Pode haver contratos vinculados.');
      }
    } catch {
      notifyError('Erro de conexão ao excluir plano.');
    }
  };

  const openEdit = (p: Plan) => {
    setEditingPlan(p.id);
    setPlanForm({
      name: p.name,
      monthly_fee: String(p.monthly_fee),
      max_dependents: p.max_dependents,
      description: p.description || '',
      commission_rate_initial:
        p.commission_rate_initial !== undefined && p.commission_rate_initial !== null
          ? String(p.commission_rate_initial)
          : '',
      commission_rate_recurring:
        p.commission_rate_recurring !== undefined && p.commission_rate_recurring !== null
          ? String(p.commission_rate_recurring)
          : '',
    });
    setIsNewPlanOpen(true);
  };

  const openNew = () => {
    setEditingPlan(null);
    setPlanForm({ ...EMPTY_FORM });
    setIsNewPlanOpen(true);
  };

  return (
    <div className="space-y-4">

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-[10px] uppercase text-zinc-500 font-bold">Planos ativos</p>
          <p className="text-2xl font-black text-emerald-400">{plans.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-[10px] uppercase text-zinc-500 font-bold">Mensalidade média</p>
          <p className="text-2xl font-black text-blue-400">
            {plans.length > 0
              ? fmtBrl(plans.reduce((s, p) => s + Number(p.monthly_fee || 0), 0) / plans.length)
              : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-[10px] uppercase text-zinc-500 font-bold">Menor mensalidade</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {plans.length > 0 ? fmtBrl(Math.min(...plans.map((p) => Number(p.monthly_fee || 0)))) : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-[10px] uppercase text-zinc-500 font-bold">Maior mensalidade</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {plans.length > 0 ? fmtBrl(Math.max(...plans.map((p) => Number(p.monthly_fee || 0)))) : '—'}
          </p>
        </div>
      </div>

      {/* Catálogo */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Catálogo de Planos Funerários</span>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Plano
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-zinc-500">Carregando planos…</p>
        ) : plans.length === 0 ? (
          <p className="text-xs text-zinc-500">
            Nenhum plano cadastrado. Crie o primeiro plano para oferecer aos associados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-500 uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <th className="pb-2 pr-3">Nome</th>
                  <th className="pb-2 pr-3">Mensalidade</th>
                  <th className="pb-2 pr-3">Dependentes</th>
                  <th className="pb-2 pr-3">Comissão (1ª / Rec.)</th>
                  <th className="pb-2 pr-3">Descrição</th>
                  <th className="pb-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800/60">
                    <td className="py-2 pr-3 font-semibold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="py-2 pr-3 text-emerald-400 font-bold">{fmtBrl(p.monthly_fee)}</td>
                    <td className="py-2 pr-3 text-slate-600 dark:text-zinc-300">{p.max_dependents}</td>
                    <td className="py-2 pr-3 text-slate-600 dark:text-zinc-300">
                      {p.commission_rate_initial ?? 0}% / {p.commission_rate_recurring ?? 0}%
                    </td>
                    <td className="py-2 pr-3 text-zinc-500 max-w-[220px] truncate" title={p.description || ''}>
                      {p.description || '—'}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        aria-label={`Editar plano ${p.name}`}
                        className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded text-[11px] font-semibold mr-1 inline-flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(p.id, p.name)}
                        aria-label={`Excluir plano ${p.name}`}
                        className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-700 text-rose-400 rounded text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}

        {/* Formulário criar/editar */}
        {isNewPlanOpen && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
              {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
            </h4>
            <form onSubmit={handleSavePlan} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome *</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  required
                  placeholder="Ex: Familiar Ouro"
                  className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Mensalidade (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={planForm.monthly_fee}
                  onChange={(e) => setPlanForm({ ...planForm, monthly_fee: e.target.value })}
                  required
                  placeholder="69.90"
                  className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Máx. Dependentes</label>
                <input
                  type="number"
                  min="0"
                  value={planForm.max_dependents}
                  onChange={(e) => setPlanForm({ ...planForm, max_dependents: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Descrição</label>
                <input
                  type="text"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="O que dá direito"
                  className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Comissão Inicial (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={planForm.commission_rate_initial}
                  onChange={(e) => setPlanForm({ ...planForm, commission_rate_initial: e.target.value })}
                  placeholder="0 (1ª mensualidade paga)"
                  className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Comissão Recorrente (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={planForm.commission_rate_recurring}
                  onChange={(e) => setPlanForm({ ...planForm, commission_rate_recurring: e.target.value })}
                  placeholder="0 (mensualidades seguintes)"
                  className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewPlanOpen(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition"
                >
                  {savingPlan ? 'Salvando...' : editingPlan ? 'Atualizar Plano' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
