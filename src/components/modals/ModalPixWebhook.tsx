'use client';

import React, { useState } from 'react';
import { X, QrCode, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ModalPixWebhookProps {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
  onPaymentUpdated?: () => void;
}

export function ModalPixWebhook({
  isOpen,
  onClose,
  payments = [],
  onPaymentUpdated
}: ModalPixWebhookProps) {
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(payments[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const currentPayment = payments.find(p => p.id === selectedPaymentId) || payments[0];

  const handleSimulateWebhook = async () => {
    if (!currentPayment) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/webhooks/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-simulation': 'true'
        },
        body: JSON.stringify({
          event: 'PAYMENT_RECEIVED',
          payment: {
            id: currentPayment.id,
            externalReference: currentPayment.holderId || currentPayment.id,
            value: parseFloat((currentPayment.amount || '').replace(/[^0-9,-]/g, '').replace(',', '.')) || 59.90,
            billingType: 'PIX',
            status: 'RECEIVED'
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na resposta do Webhook');

      setResult({
        type: 'success',
        text: `Evento PAYMENT_RECEIVED conciliado com sucesso! Contrato de ${currentPayment.holder} liquidado.`
      });

      if (onPaymentUpdated) onPaymentUpdated();
    } catch (err: any) {
      setResult({
        type: 'error',
        text: err.message || 'Falha ao disparar webhook'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Simulador de Webhook PIX</h2>
              <p className="text-xs text-zinc-400">Teste de conciliação bancária instantânea</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Selecione o Associado / Contrato</label>
            <select
              value={selectedPaymentId}
              onChange={(e) => {
                setSelectedPaymentId(e.target.value);
                setResult(null);
              }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {payments.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.holder} — {p.amount} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {result && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                result.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/60 text-red-300'
              }`}
            >
              {result.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{result.text}</span>
            </div>
          )}

          <button
            onClick={handleSimulateWebhook}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Processando Webhook...' : 'Simular Evento: PAYMENT_RECEIVED'}
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
