// Extraido de page.tsx (aba Financeiro).
// Fase 5a-1: leitura via GET /api/billing/collector.
// Fase 5a-2: lote Asaas + baixa manual (DINHEIRO REAL — window.confirm
// obrigatorio antes de cada POST). Sem logica de elegibilidade aqui —
// o backend valida (eligibility.ts, consumir nunca alterar).

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  CollectorPayment,
  Payment,
  BillingResult,
  FinancialTransaction,
  FinancialSummary,
} from '@/types/domain';
import { ModalDRE } from '@/components/dashboard/ModalDRE';
import { ModalWebhookRetry } from '@/components/dashboard/ModalWebhookRetry';
import { ModalCarnets } from '@/components/modals/ModalCarnets';
import { ModalCobrancaAvulsa } from '@/components/modals/ModalCobrancaAvulsa';
import { authFetch } from '@/lib/authFetch';
import {
  notifyError,
  notifyInfo,
  notifySuccess,
  notifyWarning,
} from '@/lib/notify';
import { isHolderActive, isContractActive } from '@/lib/eligibility';

function fmtBRL(v: number): string {
  return `R$ ${(Number(v) || 0).toFixed(2)}`;
}

// Categoria fixa gravada pela POST /api/billing/avulso (mesma do page.tsx).
const AVULSO_CATEGORY = 'Serviço Funeral Avulso';

// Resumo financeiro com bloco de vendas avulsas (mesma forma do page.tsx).
type AvulsoSummaryStats = {
  rows: { transaction_date: string | null; description: string | null; amount: number }[];
  total: number;
  monthTotal: number;
  monthCount: number;
  count: number;
};
type BillingSummary = FinancialSummary & { avulsoStats?: AvulsoSummaryStats };

// Holder com contratos (GET /api/holders) — usado na elegibilidade do lote.
type HolderOption = {
  id: string;
  full_name: string;
  status?: string | null;
  contracts?: { status?: string | null; plans?: { monthly_fee?: number } | null }[] | null;
};

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
  const [holders, setHolders] = useState<HolderOption[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<BillingResult | null>(null);

  // Secao B — Baixa manual
  const [settleTarget, setSettleTarget] = useState<CollectorRow | null>(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [settling, setSettling] = useState(false);

  // Estados para os modais religados (6d-0a; 6g-3: + retry de webhooks)
  const [dreOpen, setDreOpen] = useState(false);
  const [carnetsOpen, setCarnetsOpen] = useState(false);
  const [avulsaOpen, setAvulsaOpen] = useState(false);
  const [webhookRetryOpen, setWebhookRetryOpen] = useState(false);

  // Secao C — Vendas Avulsas (6d-0b): GET /api/financial/transactions (filtro
  // de periodo) + GET /api/financial/summary (totais sem teto de linhas).
  const [avulsoFilterFrom, setAvulsoFilterFrom] = useState('');
  const [avulsoFilterTo, setAvulsoFilterTo] = useState('');
  const [avulsoRows, setAvulsoRows] = useState<FinancialTransaction[]>([]);
  const [avulsoLoading, setAvulsoLoading] = useState(false);
  const [avulsoSummary, setAvulsoSummary] = useState<BillingSummary | null>(null);

  // Secao D — Config Gateway Asaas: REMOVIDA na 12a (opcao B).
  // O modal duplicado (estado local, F-29: nunca persistia) foi trocado
  // por link para /configuracoes#gateway, onde o form real vive
  // (TenantSettingsTab -> PATCH /api/tenants).

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

  const fetchHolders = async (signal?: { cancelled: boolean }) => {
    try {
      const res = await authFetch('/api/holders?limit=1000');
      const data = await res.json().catch(() => []);
      const list = Array.isArray(data) ? data : data?.holders || [];
      if (!signal?.cancelled) setHolders(Array.isArray(list) ? list : []);
    } catch {
      if (!signal?.cancelled) setHolders([]);
    }
  };

  useEffect(() => {
    const signal = { cancelled: false };
    loadPayments(signal);
    fetchHolders(signal);
    return () => {
      signal.cancelled = true;
    };
  }, []);

  const openBatchModal = () => {
    setBatchOpen(true);
    setBatchResult(null);
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

  // ---- Secao C — Vendas Avulsas (copiado do page.tsx, sem estado global) ----
  // Totais vêm do backend (/api/financial/summary — sem teto de linhas).
  // A lista respeita o filtro de período consultando o backend com
  // ?from=&to=&category= (rota aceita, máx. limit 1000).
  useEffect(() => {
    let cancelled = false;
    const loadSummary = async () => {
      try {
        const res = await authFetch('/api/financial/summary');
        if (!cancelled && res.ok) {
          const data = (await res.json().catch(() => null)) as BillingSummary | null;
          if (data && typeof data.totalIncome === 'number') setAvulsoSummary(data);
        }
      } catch {
        // silencioso: total cai para o reduce local das rows
      }
    };
    loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setAvulsoLoading(true);
      try {
        const params = new URLSearchParams({ category: AVULSO_CATEGORY, limit: '1000' });
        if (avulsoFilterFrom) params.set('from', avulsoFilterFrom);
        if (avulsoFilterTo) params.set('to', avulsoFilterTo);
        const res = await authFetch(`/api/financial/transactions?${params.toString()}`);
        if (!cancelled && res.ok) {
          const data = (await res.json().catch(() => [])) as FinancialTransaction[];
          if (Array.isArray(data)) setAvulsoRows(data);
        }
      } catch {
        // fallback silencioso
      } finally {
        if (!cancelled) setAvulsoLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [avulsoFilterFrom, avulsoFilterTo]);

  const avulsoStats = useMemo(() => {
    const sum = avulsoSummary?.avulsoStats;
    return {
      rows: avulsoRows,
      total: sum ? sum.total : avulsoRows.reduce((acc, t) => acc + (Number(t.amount) || 0), 0),
      monthCount: sum ? sum.monthCount : 0,
      monthTotal: sum ? sum.monthTotal : 0,
    };
  }, [avulsoRows, avulsoSummary]);

  const exportAvulsoCSV = () => {
    if (avulsoStats.rows.length === 0) {
      notifyWarning('Nenhuma venda avulsa para exportar.');
      return;
    }
    const header = 'Data;Descricao;Valor\n';
    const lines = avulsoStats.rows
      .map(
        (t) =>
          `${t.transaction_date || ''};${(t.description || '').replace(/;/g, ',')};${Number(t.amount).toFixed(2)}`,
      )
      .join('\n');
    const blob = new Blob([header + lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas_avulsas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Elegibilidade do lote (mesma regra do page.tsx e do backend — eligibility.ts).
  const asaasEligibleHolders = useMemo(
    () =>
      holders.filter(
        (h) =>
          isHolderActive(h?.status) &&
          (h?.contracts || []).some((c) => isContractActive(c.status)),
      ),
    [holders],
  );

  return (
    <div className="space-y-8 p-6">
      <section>
        <h2 className="text-lg font-bold text-white">Ferramentas</h2>
        <p className="text-xs text-slate-400">
          Modais religados na 6d-0a (eram órfãos no page.tsx); retry de webhooks na 6g-3.
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
          {/* 12a: modal duplicado removido. O form real vive em
              /configuracoes#gateway (TenantSettingsTab). */}
          <a
            href="/configuracoes#gateway"
            className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-xs font-bold"
          >
            💳 Configurar Gateway Asaas
          </a>
          <button
            onClick={() => setWebhookRetryOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
          >
            🔄 Retry de Webhooks
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

      {/* PAINEL VENDAS AVULSAS (6d-0b) — fonte: financial_transactions categoria
          "Serviço Funeral Avulso" (gravada pela POST /api/billing/avulso). */}
      <section>
        <div className="rounded-xl border border-amber-500/30 bg-[#0d121f] p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              💰 Vendas Avulsas (não-associados)
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={avulsoFilterFrom}
                onChange={(e) => setAvulsoFilterFrom(e.target.value)}
                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
              />
              <span className="text-xs text-slate-500">até</span>
              <input
                type="date"
                value={avulsoFilterTo}
                onChange={(e) => setAvulsoFilterTo(e.target.value)}
                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
              />
              <button
                onClick={() => {
                  setAvulsoFilterFrom('');
                  setAvulsoFilterTo('');
                }}
                className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600"
              >
                Limpar
              </button>
              <button
                onClick={exportAvulsoCSV}
                className="rounded bg-emerald-600 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-500"
              >
                📥 CSV
              </button>
              <button
                onClick={() => setAvulsaOpen(true)}
                className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 shadow hover:bg-slate-600"
              >
                + Nova Cobrança Avulsa
              </button>
            </div>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Total histórico</p>
              <p className="text-sm font-bold text-emerald-400">{fmtBRL(avulsoStats.total)}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Este mês</p>
              <p className="text-sm font-bold text-emerald-400">{fmtBRL(avulsoStats.monthTotal)}</p>
              <p className="text-[10px] text-slate-500">{avulsoStats.monthCount} cobrança(s)</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Registros</p>
              <p className="text-sm font-bold text-slate-200">{avulsoStats.rows.length}</p>
            </div>
          </div>
          {avulsoLoading ? (
            <p className="text-[11px] text-slate-500">Carregando…</p>
          ) : avulsoStats.rows.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              Nenhuma venda avulsa registrada ainda. Use &quot;+ Nova Cobrança Avulsa&quot; para
              faturar um funeral de cliente não-associado — boleto ou PIX via Asaas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500">
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Descrição</th>
                    <th className="px-3 py-2">OS</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {avulsoStats.rows.slice(0, 8).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-slate-400">
                        {tx.transaction_date}
                      </td>
                      <td className="px-3 py-2 text-slate-200">{tx.description}</td>
                      <td className="px-3 py-2 font-mono text-amber-400">
                        {tx.service_order_id ? (
                          <span title="OS vinculada">{tx.service_order_id.slice(0, 6)}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-bold text-emerald-400">
                        + {fmtBRL(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {avulsoStats.rows.length > 8 && (
                <p className="px-3 py-2 text-[10px] text-slate-500">
                  Mostrando as 8 mais recentes de {avulsoStats.rows.length}. Lista completa no
                  Livro Caixa, filtrando pela categoria &quot;Serviço Funeral Avulso&quot;.
                </p>
              )}
            </div>
          )}
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

      {/* Modais religados na 6d-0a e na 6g-3 (retry de webhooks) */}
      <ModalDRE isOpen={dreOpen} onClose={() => setDreOpen(false)} />
      <ModalCarnets isOpen={carnetsOpen} onClose={() => setCarnetsOpen(false)} />
      <ModalCobrancaAvulsa isOpen={avulsaOpen} onClose={() => setAvulsaOpen(false)} />
      <ModalWebhookRetry isOpen={webhookRetryOpen} onClose={() => setWebhookRetryOpen(false)} />
    </div>
  );
}

