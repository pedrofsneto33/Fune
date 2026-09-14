// Extraido de page.tsx (aba Financeiro). READ-ONLY.
// Fase 5a-1: leitura de pagamentos via GET /api/billing/collector.
// Sem formularios, sem POST/PATCH — mutacoes viram 5a-2.
// Sem logica de elegibilidade aqui — o backend valida (eligibility.ts).

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CollectorPayment, Payment } from '@/types/domain';
import { authFetch } from '@/lib/authFetch';
import { notifyError } from '@/lib/notify';

type CollectorRow = Payment & {
  contracts?: {
    id?: string;
    holders?: { full_name?: string } | { full_name?: string }[] | null;
  } | null;
};

function holderLabel(row: CollectorRow): string {
  const h = row.contracts?.holders;
  const name = Array.isArray(h) ? h[0]?.full_name : h?.full_name;
  return name || row.holder_name || row.description || '—';
}

export default function BillingTab() {
  const [payments, setPayments] = useState<CollectorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const res = await authFetch('/api/billing/collector');
        const data = await res.json().catch(() => []);
        if (!cancel) setPayments(Array.isArray(data) ? data : []);
      } catch {
        if (!cancel) notifyError('Erro ao carregar pagamentos.');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!statusFilter) return payments;
    return payments.filter((p) => p.status === statusFilter);
  }, [payments, statusFilter]);

  const received: CollectorPayment[] = useMemo(
    () =>
      payments
        .filter((p) => p.status === 'paid')
        .map((p) => ({
          id: p.id,
          amount: Number(p.amount) || 0,
          status: p.status,
          contract_id: p.contract_id,
          paid_at: p.paid_at,
        })),
    [payments],
  );

  const totalReceived = useMemo(
    () => received.reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
    [received],
  );

  return (
    <div className="space-y-8 p-6">
      <section>
        <h2 className="text-lg font-bold text-white">Pagamentos recentes</h2>
        <p className="text-xs text-slate-400">Fonte: GET /api/billing/collector (somente leitura).</p>
        <div className="mt-3 flex items-center gap-2">
          <label className="text-xs text-slate-400" htmlFor="billing-status">
            Status:
          </label>
          <select
            id="billing-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
          >
            <option value="">Todos</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="overdue">Atrasado</option>
          </select>
        </div>
        {loading ? (
          <p className="mt-3 text-xs text-slate-400">Carregando…</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full text-xs text-slate-200">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2 text-left">Titular/Descrição</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-slate-800">
                    <td className="px-3 py-2">{p.paid_at || p.due_date || p.created_at || '—'}</td>
                    <td className="px-3 py-2">{holderLabel(p)}</td>
                    <td className="px-3 py-2 text-right">
                      R$ {(Number(p.amount) || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">{p.payment_method || p.billing_type || '—'}</td>
                    <td className="px-3 py-2">{p.status}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr className="border-t border-slate-800">
                    <td className="px-3 py-4 text-center text-slate-500" colSpan={5}>
                      Nenhum pagamento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-white">Baixas recebidas</h2>
        <p className="text-xs text-slate-400">
          Somente leitura — ações de baixa viram 5a-2. Total recebido: R${' '}
          {totalReceived.toFixed(2)} ({received.length} baixa(s)).
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800">
          <table className="min-w-full text-xs text-slate-200">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">Pago em</th>
                <th className="px-3 py-2 text-left">Contrato</th>
                <th className="px-3 py-2 text-right">Valor</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {received.map((p) => (
                <tr key={p.id} className="border-t border-slate-800">
                  <td className="px-3 py-2">{p.paid_at || '—'}</td>
                  <td className="px-3 py-2">{p.contract_id || '—'}</td>
                  <td className="px-3 py-2 text-right">R$ {(Number(p.amount) || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">{p.status}</td>
                </tr>
              ))}
              {received.length === 0 && (
                <tr className="border-t border-slate-800">
                  <td className="px-3 py-4 text-center text-slate-500" colSpan={4}>
                    Nenhuma baixa recebida.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

