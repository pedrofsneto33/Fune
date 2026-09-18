'use client';
import React, { useEffect, useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifySuccess } from '@/lib/notify';

/**
 * Fase 4c — criar assinatura SaaS para um tenant (superadmin).
 * Segue o padrao do ModalChapel: overlay + card, estado local, submit
 * via authFetch e onSuccess() para o parent refazer o fetch.
 */

export interface SaasTenantOption {
  id: string;
  name: string | null;
  cnpj: string | null;
  subscription: {
    plan: string;
    status: string;
    valor: number;
    next_due_date: string | null;
    grace_until: string | null;
  } | null;
}

// Preco fixo por plano; enterprise = sob consulta (usuario digita).
const PLAN_PRICES: Record<string, number> = {
  essencial: 397,
  profissional: 597,
  enterprise: 0,
};

function plusDaysISO(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

export function ModalSubscribeSaaS({
  isOpen,
  onClose,
  onSuccess,
  tenants,
  initialTenantId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tenants: SaasTenantOption[];
  initialTenantId?: string | null;
}) {
  const available = tenants.filter((t) => !t.subscription);

  const [tenantId, setTenantId] = useState(() => initialTenantId || available[0]?.id || '');
  const [plan, setPlan] = useState('essencial');
  const [valor, setValor] = useState<number>(PLAN_PRICES.essencial);
  const [nextDueDate, setNextDueDate] = useState(() => plusDaysISO(7));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reabriu o modal: respeita o tenant vindo da linha (initialTenantId) ou
  // cai no primeiro tenant sem assinatura; zera plano/valor/vencimento.
  useEffect(() => {
    if (!isOpen) return;
    setTenantId(initialTenantId || available[0]?.id || '');
    setPlan('essencial');
    setValor(PLAN_PRICES.essencial);
    setNextDueDate(plusDaysISO(7));
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTenantId]);

  if (!isOpen) return null;

  const isEnterprise = plan === 'enterprise';

  const handlePlanChange = (value: string) => {
    setPlan(value);
    setValor(PLAN_PRICES[value] ?? 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setError('Selecione o tenant.');
      return;
    }
    if (!Number.isFinite(Number(valor)) || Number(valor) <= 0) {
      setError('Valor deve ser maior que zero.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await authFetch('/api/saas/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, plan, valor: Number(valor), nextDueDate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data as { error?: string }).error || 'Erro ao criar assinatura.';
        setError(msg);
        notifyError(msg);
        return;
      }
      notifySuccess('Assinatura criada com sucesso.');
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      setError('Erro de conexão ao criar assinatura.');
      notifyError('Erro de conexão ao criar assinatura.');
    } finally {
      setSubmitting(false);
    }
  };
return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <h3 className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Nova assinatura SaaS
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {available.length === 0 ? (
          <p className="text-xs text-zinc-400">Todos os tenants ja tem assinatura.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div>
              <label className="text-xs text-zinc-400 block mb-1" htmlFor="saas-sub-tenant">
                Tenant
              </label>
              <select
                id="saas-sub-tenant"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                {available.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.id}{t.cnpj ? ` (${t.cnpj})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1" htmlFor="saas-sub-plan">
                Plano
              </label>
              <select
                id="saas-sub-plan"
                value={plan}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="essencial">essencial</option>
                <option value="profissional">profissional</option>
                <option value="enterprise">enterprise</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1" htmlFor="saas-sub-valor">
                Valor mensal (R$)
              </label>
              <input
                id="saas-sub-valor"
                required
                type="number"
                min="0"
                step="0.01"
                disabled={!isEnterprise}
                value={valor}
                onChange={(e) => setValor(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white disabled:opacity-60"
              />
              {isEnterprise && (
                <p className="mt-1 text-[10px] text-zinc-500">Enterprise: valor sob consulta.</p>
              )}
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1" htmlFor="saas-sub-due">
                Vencimento
              </label>
              <input
                id="saas-sub-due"
                required
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                disabled={submitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-60"
              >
                {submitting ? 'Criando...' : 'Criar assinatura'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
