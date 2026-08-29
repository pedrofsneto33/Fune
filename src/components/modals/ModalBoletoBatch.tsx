'use client';

import React, { useState } from 'react';
import { FileText, X, Check, Copy, ExternalLink, Calendar, DollarSign, Layers } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

interface ModalBoletoBatchProps {
  isOpen: boolean;
  onClose: () => void;
  holders: any[];
  onSuccess?: () => void;
}

export function ModalBoletoBatch({ isOpen, onClose, holders, onSuccess }: ModalBoletoBatchProps) {
  const { currentTenant } = useTenant();
  const [selectedHolderId, setSelectedHolderId] = useState('');
  const [type, setType] = useState<'single' | 'carne'>('carne');
  const [installments, setInstallments] = useState(12);
  const [monthlyValue, setMonthlyValue] = useState('65.00');
  const [firstDueDate, setFirstDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedHolder = holders.find(h => h.id === selectedHolderId || h.holder_id === selectedHolderId);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      if (!selectedHolder) {
        throw new Error('Selecione um associado titular.');
      }

      const count = type === 'single' ? 1 : Number(installments);
      const total = (Number(monthlyValue) * count).toFixed(2);

      const res = await fetch('/api/billing/boleto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant?.id || selectedHolder.tenant_id,
          contract_id: selectedHolder.contract_id || selectedHolder.id,
          holder_id: selectedHolder.id,
          holder_name: selectedHolder.full_name || selectedHolder.holder,
          holder_cpf: selectedHolder.cpf,
          holder_email: selectedHolder.email,
          holder_phone: selectedHolder.phone,
          total_value: total,
          installment_count: count,
          first_due_date: firstDueDate,
          description: type === 'carne' ? `Carnê Anual - ${count}x R$ ${monthlyValue}` : `Mensalidade Plano Funerário`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao emitir boleto/carnê no Asaas.');
      }

      setResult(data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const copyDigitableLine = () => {
    if (result?.identificationField) {
      navigator.clipboard.writeText(result.identificationField);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 my-8">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Emissão de Boletos & Carnê em Lote</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}

        {!result ? (
          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Selecione o Associado Titular</label>
              <select
                required
                value={selectedHolderId}
                onChange={(e) => setSelectedHolderId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Selecione o Associado --</option>
                {holders.map((h, i) => (
                  <option key={i} value={h.id || h.holder_id}>
                    {h.full_name || h.holder} - CPF: {h.cpf || 'N/D'} ({h.plan || 'Plano Padrão'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Tipo de Cobrança</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="carne">Carnê em Lote (Parcelado)</option>
                  <option value="single">Boleto Único (1 Mês)</option>
                </select>
              </div>

              {type === 'carne' && (
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Nº de Parcelas</label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={3}>3x (Trimestral)</option>
                    <option value={6}>6x (Semestral)</option>
                    <option value={12}>12x (Anual - Padrão)</option>
                    <option value={24}>24x (Biênio)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Valor da Parcela (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={monthlyValue}
                  onChange={(e) => setMonthlyValue(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">1º Vencimento</label>
                <input
                  type="date"
                  required
                  value={firstDueDate}
                  onChange={(e) => setFirstDueDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-400 space-y-1 text-[11px]">
              <p>Filial / Gateway: <strong className="text-white">{currentTenant?.name || 'Filial Ativa'}</strong></p>
              <p>Total do Carnê: <strong className="text-emerald-400">R$ {(Number(monthlyValue) * (type === 'single' ? 1 : installments)).toFixed(2)}</strong> ({type === 'single' ? '1 parcela' : `${installments} parcelas de R$ ${monthlyValue}`})</p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !selectedHolderId}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Emitindo no Asaas...' : 'Gerar Títulos no Asaas'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
              <p className="text-emerald-400 font-bold text-sm">Cobrança Gerada com Sucesso!</p>
              <p className="text-zinc-300">
                {result.installmentCount > 1
                  ? `Carnê de ${result.installmentCount} parcelas registrado na filial.`
                  : 'Boleto bancário registrado com sucesso.'}
              </p>
            </div>

            {result.identificationField && (
              <div className="space-y-1">
                <label className="text-zinc-400 block font-semibold">Linha Digitável (1ª Parcela):</label>
                <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-200">
                  <span className="truncate flex-1">{result.identificationField}</span>
                  <button
                    onClick={copyDigitableLine}
                    className="p-1.5 hover:bg-zinc-800 rounded text-blue-400"
                    title="Copiar Linha Digitável"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {result.bankSlipUrl && (
                <a
                  href={result.bankSlipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir Boleto / Carnê (PDF)
                </a>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
              >
                Concluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}