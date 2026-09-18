'use client';

// Fase 4b — painel admin SaaS (superadmin global). Lista tenants +
// assinatura agregada + KPIs. SO LEITURA: acoes entram na Fase 4c.
// Fonte: GET /api/saas/tenants (403 => acesso restrito).

import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { notifyError } from '@/lib/notify';

interface SaasSubscription {
  plan: string;
  status: string;
  valor: number;
  next_due_date: string | null;
  grace_until: string | null;
}

interface SaasTenant {
  id: string;
  name: string | null;
  cnpj: string | null;
  commercial_plan: string | null;
  status: string | null;
  subscription: SaasSubscription | null;
}

interface SaasKpis {
  mrr_total: number;
  ativos: number;
  inadimplentes: number;
  total_tenants: number;
}

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'active' },
  { value: 'past_due', label: 'past_due' },
  { value: 'suspended', label: 'suspended' },
  { value: 'trial', label: 'trial' },
  { value: 'none', label: 'Sem assinatura' },
];

const BADGE_CLASSES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  past_due: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  suspended: 'bg-red-500/15 text-red-300 border-red-500/30',
  trial: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
};

const BADGE_FALLBACK = 'bg-slate-500/15 text-slate-300 border-slate-500/30';

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold ${BADGE_FALLBACK}`}>
        sem assinatura
      </span>
    );
  }
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold ${
        BADGE_CLASSES[status] || BADGE_FALLBACK
      }`}
    >
      {status}
    </span>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export function SaasAdminTab() {
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState('');
  const [kpis, setKpis] = useState<SaasKpis | null>(null);
  const [tenants, setTenants] = useState<SaasTenant[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const res = await authFetch('/api/saas/tenants');
        if (res.status === 403) {
          if (!cancel) setForbidden(true);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = (data as { error?: string }).error || 'Falha ao carregar painel SaaS.';
          if (!cancel) {
            setError(msg);
            notifyError(msg);
          }
          return;
        }
        if (!cancel) {
          setKpis((data as { kpis?: SaasKpis }).kpis || null);
          const list = (data as { tenants?: SaasTenant[] }).tenants;
          setTenants(Array.isArray(list) ? list : []);
        }
      } catch {
        if (!cancel) {
          setError('Erro de conexão ao carregar painel SaaS.');
          notifyError('Erro de conexão ao carregar painel SaaS.');
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!statusFilter) return tenants;
    if (statusFilter === 'none') return tenants.filter((t) => !t.subscription);
    return tenants.filter((t) => t.subscription?.status === statusFilter);
  }, [tenants, statusFilter]);

  if (forbidden) {
    return (
      <div className="p-6">
        <p className="text-sm text-amber-300">Acesso restrito a superadmin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Painel SaaS</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Visão geral das assinaturas</p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="MRR Total" value={kpis ? brl(kpis.mrr_total) : '—'} />
        <KpiCard label="Ativos" value={kpis ? String(kpis.ativos) : '—'} />
        <KpiCard label="Inadimplentes" value={kpis ? String(kpis.inadimplentes) : '—'} />
        <KpiCard label="Total de Tenants" value={kpis ? String(kpis.total_tenants) : '—'} />
      </section>

      <section>
        {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400" htmlFor="saas-status">
            Status:
          </label>
          <select
            id="saas-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="mt-3 text-xs text-slate-400">Carregando…</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Tenant</th>
                  <th className="px-3 py-2 text-left">Plano SaaS</th>
                  <th className="px-3 py-2 text-left">Status assinatura</th>
                  <th className="px-3 py-2 text-left">Valor</th>
                  <th className="px-3 py-2 text-left">Vencimento</th>
                  <th className="px-3 py-2 text-left">Grace</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-3 py-2">
                      <span className="block font-semibold">{t.name || '—'}</span>
                      <span className="block text-[10px] text-slate-500">{t.cnpj || '—'}</span>
                    </td>
                    <td className="px-3 py-2">{t.subscription?.plan || '—'}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={t.subscription?.status || null} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {t.subscription ? brl(t.subscription.valor) : '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{t.subscription?.next_due_date || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{t.subscription?.grace_until || '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-3 py-4 text-center text-slate-500" colSpan={6}>
                      Nenhum tenant encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default SaasAdminTab;
