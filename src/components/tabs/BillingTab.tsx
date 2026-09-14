// Extraido de page.tsx (aba Financeiro).
// Fase 5a-1: leitura via GET /api/billing/collector.
// Fase 5a-2: lote Asaas + baixa manual (DINHEIRO REAL — window.confirm
// obrigatorio antes de cada POST). Sem logica de elegibilidade aqui —
// o backend valida (eligibility.ts, consumir nunca alterar).

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CollectorPayment, Payment, BillingResult } from '@/types/domain';
import { ModalDRE } from '@/components/dashboard/ModalDRE';
import { ModalCarnets } from '@/components/modals/ModalCarnets';
import { ModalCobrancaAvulsa } from '@/components/modals/ModalCobrancaAvulsa';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifySuccess } from '@/lib/notify';

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

  // Secao A — Gerar lote Asaas
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchType, setBatchType] = useState('BOLETO');
  const [batchDueDate, setBatchDueDate] = useState('');
  const [batchHolderId, setBatchHolderId] = useState('');
  const [holders, setHolders] = useState<{ id: string; full_name: string }[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<BillingResult | null>(null);

  // Secao B — Baixa manual
  const [settleTarget, setSettleTarget] = useState<CollectorRow | null>(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [settling, setSettling] = useState(false);

  // Estados para os modais religados (6d-0a)
  const [dreOpen, setDreOpen] = useState(false);
  const [carnetsOpen, setCarnetsOpen] = useState(false);
  const [avulsaOpen, setAvulsaOpen] = useState(false);

  const loadPayments = async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    try {
      const res = await authFetch('/api/billing/collector');
      const data = await res.json().catch(() => []);
      if (!signal?.cancelled) setPayments(Array.isArray(data) ? data : []);
    } catch {
      if (!signal?.cancelled) notifyError('Erro ao carregar pagamentos.');
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  };

  useEffect(() => {
    const signal = { cancelled: false };
    loadPayments(signal);
    return () => {
      signal.cancelled = true;
    };
  }, []);

  const openBatchModal = async () => {
    setBatchOpen(true);
    setBatchResult(null);
    try {
      const res = await authFetch('/api/holders?limit=1000');
      const data = await res.json().catch(() => []);
      const list = Array.isArray(data) ? data : data?.holders || [];
      setHolders(
        list.map((h: { id: string; full_name: string }) => ({
          id: h.id,
          full_name: h.full_name,
        })),
      );
    } catch {
      setHolders([]);
    }
  };

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

  const handleGenerateBatch = async () => {
    if (
      !window.confirm('Gerar lote de cobranças? Isso criará cobranças REAIS.')
    ) {
      return;
    }
    setBatchRunning(true);
    try {
      const res = await authFetch('/api/billing/asaas-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingType: batchType,
          dueDate: batchDueDate || undefined,
          holderId: batchHolderId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !(data as { success?: boolean }).success) {
        notifyError(`Erro Asaas: ${(data as { error?: string }).error || 'Falha ao processar lote'}`);
        return;
      }
      const result = data as BillingResult;
      setBatchResult(result);
      notifySuccess(
        `Asaas: ${result.created} criada(s), ${result.skipped} ignorada(s), ${result.failed} com erro.`,
      );
    } catch {
      notifyError('Erro de conexão ao processar lote Asaas.');
    } finally {
      setBatchRunning(false);
    }
  };

  const openSettleModal = (row: CollectorRow) => {
    setSettleTarget(row);
    setReceivedAmount(String(row.amount ?? ''));
  };

  const handleSettle = async () => {
    if (!settleTarget) return;
    if (!window.confirm('Confirmar recebimento?')) return;
    setSettling(true);
    try {
      const res = await authFetch('/api/billing/collector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: settleTarget.id,
          receivedAmount: receivedAmount ? Number(receivedAmount) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !(data as { success?: boolean }).success) {
        notifyError(`Erro ao dar baixa: ${(data as { error?: string }).error || 'Falha na baixa'}`);
        return;
      }
      notifySuccess('Baixa registrada com sucesso.');
      setSettleTarget(null);
      await loadPayments();
    } catch {
      notifyError('Erro de conexão ao dar baixa.');
    } finally {
      setSettling(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <section>
        <h2 className="text-lg font-bold text-white">Ferramentas</h2>
        <p className="text-xs text-slate-400">
          Modais religados na 6d-0a (eram órfãos no page.tsx).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setDreOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
          >
            Abrir DRE
          </button>
          <button
            onClick={() => setCarnetsOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
          >
            Carnês
          </button>
          <button
            onClick={() => setAvulsaOpen(true)}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold"
          >
            Nova Cobrança Avulsa
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-white">Gerar lote Asaas</h2>
        <p className="text-xs text-slate-400">
          Cria cobranças REAIS no Asaas. Use com cuidado.
        </p>
        <button
          onClick={openBatchModal}
          className="mt-3 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow"
        >
          Gerar Lote Asaas
        </button>
      </section>

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
                  <th className="px-3 py-2 text-left">Ação</th>
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
                    <td className="px-3 py-2">
                      {p.status !== 'paid' && (
                        <button
                          onClick={() => openSettleModal(p)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
                        >
                          Dar baixa
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr className="border-t border-slate-800">
                    <td className="px-3 py-4 text-center text-slate-500" colSpan={6}>
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
          Total recebido: R${' '}
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

      {batchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-700 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Gerar Lote Asaas</h3>
            <p className="text-xs text-red-300 font-bold">
              ATENÇÃO: cria cobranças REAIS no Asaas.
            </p>
            <div className="space-y-2">
              <label className="block text-xs text-slate-300">
                Tipo de cobrança
                <select
                  value={batchType}
                  onChange={(e) => setBatchType(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                >
                  <option value="PIX">PIX</option>
                  <option value="BOLETO">BOLETO</option>
                  <option value="UNDEFINED">Indefinido</option>
                </select>
              </label>
              <label className="block text-xs text-slate-300">
                Vencimento
                <input
                  type="date"
                  value={batchDueDate}
                  onChange={(e) => setBatchDueDate(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </label>
              <label className="block text-xs text-slate-300">
                Titular (opcional)
                <select
                  value={batchHolderId}
                  onChange={(e) => setBatchHolderId(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                >
                  <option value="">Todos os ativos</option>
                  {holders.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.full_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {batchResult && (
              <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200">
                <p className="font-bold text-white">Resumo do lote</p>
                <p>
                  Criadas: {batchResult.created} · Ignoradas: {batchResult.skipped} · Erros:{' '}
                  {batchResult.failed}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setBatchOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
              >
                Fechar
              </button>
              <button
                onClick={handleGenerateBatch}
                disabled={batchRunning}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
              >
                {batchRunning ? 'Gerando…' : 'Confirmar lote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {settleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-lg bg-slate-900 border border-slate-700 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Dar baixa</h3>
            <p className="text-xs text-slate-400">
              {holderLabel(settleTarget)} · R$ {(Number(settleTarget.amount) || 0).toFixed(2)}
            </p>
            <label className="block text-xs text-slate-300">
              Valor recebido
              <input
                type="number"
                step="0.01"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSettleTarget(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleSettle}
                disabled={settling}
                className="px-3 py-1.5 bg-slate-100 hover:bg-white disabled:opacity-50 text-slate-900 rounded-lg text-xs font-bold"
              >
                {settling ? 'Baixando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais religados na 6d-0a */}
      <ModalDRE isOpen={dreOpen} onClose={() => setDreOpen(false)} />
      <ModalCarnets isOpen={carnetsOpen} onClose={() => setCarnetsOpen(false)} />
      <ModalCobrancaAvulsa isOpen={avulsaOpen} onClose={() => setAvulsaOpen(false)} />
    </div>
  );
}

