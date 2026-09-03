'use client';

import React from 'react';
import { Zap, X } from 'lucide-react';

interface ModalPixSimProps {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
  targetPaymentId: string;
  setTargetPaymentId: (val: string) => void;
  loading: boolean;
  onSimulate: (e: React.FormEvent) => void;
}

export function ModalPixSim({
  isOpen,
  onClose,
  payments,
  targetPaymentId,
  setTargetPaymentId,
  loading,
  onSimulate
}: ModalPixSimProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 border border-amber-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Simulador de Webhook PIX</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSimulate} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Selecione o Pagamento / Mensalidade</label>
            <select
              value={targetPaymentId}
              onChange={(e) => setTargetPaymentId(e.target.value)}
              required
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Escolha um associado com pagamento pendente --</option>
              {payments.filter(p => p.status === 'Pendente').map(p => (
                <option key={p.id} value={p.id}>{p.holder} - R$ {p.amount} ({p.plan})</option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-zinc-400">
            Esta ação dispara uma notificação assíncrona fingindo a confirmação bancária do Asaas para testar baixa automática e reserva atuarial.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !targetPaymentId}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white dark:text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Disparando Webhook...' : 'Simular Liquidação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}