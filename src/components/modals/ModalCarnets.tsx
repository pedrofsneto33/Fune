'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { X, CreditCard, PlusCircle, RefreshCw } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

interface CarnetRow {
  id: string;
  holder_name: string;
  contract_id: string | null;
  installment_number: number;
  total_installments: number;
  due_date: string;
  amount: number | string;
  status: string;
}

interface HolderContract {
  id: string;
  status: string;
  plans: { name: string; monthly_fee: number } | null;
}

interface HolderRow {
  id: string;
  full_name: string;
  cpf?: string | null;
  contracts?: HolderContract[] | null;
}

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

const STATUS_STYLE: Record<string, string> = {
  pago: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  pendente: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  atrasado: 'bg-red-500/15 text-red-400 border-red-500/30',
  cancelado: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

export function ModalCarnets({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [carnets, setCarnets] = useState<CarnetRow[]>([]);
  const [holders, setHolders] = useState<HolderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // formulario de geracao
  const [formHolderId, setFormHolderId] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [installments, setInstallments] = useState('1');
  const [firstDue, setFirstDue] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [hRes, cRes] = await Promise.all([
        authFetch('/api/holders'),
        authFetch('/api/payment-carnets'),
      ]);
      if (hRes.ok) {
        const hd = await hRes.json();
        if (Array.isArray(hd)) setHolders(hd);
      }
      if (cRes.ok) {
        const cd = await cRes.json();
        if (Array.isArray(cd)) setCarnets(cd);
      }
    } catch {
      // estado vazio e exibido no modal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFormHolderId('');
      setTotalValue('');
      setInstallments('1');
      setFirstDue('');
      loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      const res = await authFetch('/api/payment-carnets', {
        method: 'PATCH',
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar parcela');
      await loadAll();
      if (onSuccess) onSuccess();
    } catch (e) {
      alert('Erro ao atualizar parcela: ' + (e as Error).message);
    } finally {
      setBusyId(undefined);
    }
  };

  const selectedHolder = holders.find((h) => h.id === formHolderId);
  const selectedContract =
    selectedHolder?.contracts?.find((c) => c.status === 'ativo') ||
    selectedHolder?.contracts?.[0] ||
    null;
  const numInstallments = Math.min(Math.max(parseInt(installments, 10) || 1, 1), 12);
  const parcelValue = Number(totalValue) > 0 ? Number(totalValue) / numInstallments : 0;

  // Compilado por usuario credenciado: cada titular (com ou sem carnes) com seus numeros
  const compiled = useMemo(() => {
    const byName = new Map<string, CarnetRow[]>();
    for (const c of carnets) {
      const key = (c.holder_name || 'Sem titular').trim();
      const arr = byName.get(key) || [];
      arr.push(c);
      byName.set(key, arr);
    }
    const groups = holders.map((h) => {
      const list = byName.get(h.full_name.trim()) || [];
      byName.delete(h.full_name.trim());
      return {
        name: h.full_name,
        cpf: h.cpf || null,
        plan: h.contracts?.[0]?.plans?.name || null,
        contractStatus: h.contracts?.[0]?.status || null,
        list,
      };
    });
    for (const [name, list] of byName) {
      groups.push({ name, cpf: null, plan: null, contractStatus: null, list });
    }
    return groups.map((g) => {
      const active = g.list
        .filter((c) => c.status !== 'cancelado')
        .sort((a, b) => a.installment_number - b.installment_number);
      const paidList = active.filter((c) => c.status === 'pago');
      const nextDue =
        active
          .filter((c) => c.status !== 'pago')
          .map((c) => c.due_date)
          .sort()[0] || null;
      return {
        ...g,
        active,
        parcelas: active.length,
        total: active.reduce((s, c) => s + Number(c.amount), 0),
        paidCount: paidList.length,
        paidTotal: paidList.reduce((s, c) => s + Number(c.amount), 0),
        pending: active.filter((c) => c.status === 'pendente').length,
        late: active.filter((c) => c.status === 'atrasado').length,
        nextDue,
      };
    });
  }, [carnets, holders]);

  const grandTotals = useMemo(() => {
    const active = carnets.filter((c) => c.status !== 'cancelado');
    const paidList = active.filter((c) => c.status === 'pago');
    return {
      holders: new Set(active.map((c) => (c.holder_name || '').trim())).size,
      parcelas: active.length,
      total: active.reduce((s, c) => s + Number(c.amount), 0),
      paidCount: paidList.length,
      paidTotal: paidList.reduce((s, c) => s + Number(c.amount), 0),
      pending: active.filter((c) => c.status === 'pendente').length,
      late: active.filter((c) => c.status === 'atrasado').length,
    };
  }, [carnets]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolder) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/payment-carnets', {
        method: 'POST',
        body: JSON.stringify({
          contract_id: selectedContract?.id || null,
          holder_name: selectedHolder.full_name,
          amount: Number(totalValue),
          due_date: firstDue,
          installments: numInstallments,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar carnê');
      if (onSuccess) onSuccess();
      setTotalValue('');
      setInstallments('1');
      setFirstDue('');
      await loadAll();
    } catch (err) {
      alert('Erro ao gerar carnê: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-violet-400" /> Carnês de Pagamento — Visão Compilada
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={loadAll} title="Recarregar" className="text-zinc-400 hover:text-white">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOTAIS GERAIS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Titulares c/ carnê</p>
            <p className="text-sm font-bold text-white">{grandTotals.holders}</p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Valor Total</p>
            <p className="text-sm font-bold text-violet-400">{brl(grandTotals.total)}</p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Pago</p>
            <p className="text-sm font-bold text-emerald-400">{brl(grandTotals.paidTotal)}</p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Atrasado</p>
            <p className="text-sm font-bold text-red-400">
              {grandTotals.late} {grandTotals.late === 1 ? 'parcela' : 'parcelas'}
            </p>
          </div>
        </div>

        {/* COMPILADO POR USUARIO CREDENCIADO */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-zinc-400 uppercase">
            Compilado por Usuário Credenciado
          </p>
          {loading && (
            <p className="text-xs text-zinc-500 py-4 text-center">
              Carregando carnês e titulares credenciados...
            </p>
          )}
          {!loading && compiled.length === 0 && (
            <p className="text-xs text-zinc-500 py-4 text-center">
              Nenhum titular credenciado ou carnê cadastrado ainda.
            </p>
          )}
          {!loading &&
            compiled.map((g) => (
              <div key={g.name} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-xs font-bold text-white">{g.name}</p>
                    <p className="text-[10px] text-zinc-500">
                      {g.cpf ? `CPF: ${g.cpf}` : 'Sem CPF vinculado'}
                      {g.plan ? ` • ${g.plan}` : ''}
                      {g.contractStatus ? ` (${g.contractStatus})` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-violet-400">{brl(g.total)}</p>
                    <p className="text-[10px] text-zinc-500">
                      {g.parcelas} {g.parcelas === 1 ? 'parcela' : 'parcelas'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                    {g.paidCount} pago(s) • {brl(g.paidTotal)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-400 border-amber-500/30">
                    {g.pending} pendente(s)
                  </span>
                  <span className="px-2 py-0.5 rounded-full border bg-red-500/15 text-red-400 border-red-500/30">
                    {g.late} atrasada(s)
                  </span>
                  {g.nextDue && (
                    <span className="px-2 py-0.5 rounded-full border bg-zinc-500/15 text-zinc-300 border-zinc-500/30">
                      Próx.: {new Date(g.nextDue + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>

                {g.active.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {g.active.map((c) => (
                      <div
                        key={c.id}
                        className="flex justify-between items-center bg-zinc-900 rounded-lg px-2 py-1.5 text-[11px]"
                      >
                        <span className="text-zinc-400">
                          {c.installment_number}/{c.total_installments} •{' '}
                          {new Date(c.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-zinc-200 font-semibold">{brl(Number(c.amount))}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-full border ${STATUS_STYLE[c.status] || STATUS_STYLE.pendente}`}
                          >
                            {c.status}
                          </span>
                          {c.status !== 'pago' && c.status !== 'cancelado' && (
                            <button
                              onClick={() => updateStatus(c.id, 'pago')}
                              disabled={busyId === c.id}
                              className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold disabled:opacity-50"
                              title="Marcar como pago"
                            >
                              {busyId === c.id ? '...' : '✓'}
                            </button>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* FORM GERAR NOVO CARNE */}
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-3 border-t-2 border-t-violet-600/50"
        >
          <p className="text-[11px] font-bold text-violet-400 uppercase flex items-center gap-1.5">
            <PlusCircle className="w-3.5 h-3.5" /> Gerar Novo Carnê
          </p>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Usuário Credenciado (Titular)</label>
            <select
              required
              value={formHolderId}
              onChange={(e) => setFormHolderId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="">— Selecione o titular credenciado —</option>
              {holders.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.full_name}
                  {h.cpf ? ` — ${h.cpf}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Parcelas</label>
              <select
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={String(n)}>
                    {n}x
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Valor Total (R$)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">1º Vencimento</label>
              <input
                required
                type="date"
                value={firstDue}
                onChange={(e) => setFirstDue(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
          {parcelValue > 0 && selectedHolder && (
            <p className="text-[11px] text-zinc-400">
              {numInstallments}x de <span className="font-bold text-violet-400">{brl(parcelValue)}</span> para{' '}
              <span className="font-bold text-white">{selectedHolder.full_name}</span>
              {selectedContract?.plans?.name
                ? ` • contrato ${selectedContract.id.substring(0, 8)} (${selectedContract.plans.name})`
                : selectedHolder.contracts && selectedHolder.contracts.length === 0
                  ? ' • sem contrato ativo (boleto Asaas não será emitido)'
                  : ''}
            </p>
          )}
          <button
            disabled={saving || !formHolderId}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" /> {saving ? 'Gerando carnê...' : 'Gerar Carnê'}
          </button>
        </form>
      </div>
    </div>
  );
}
