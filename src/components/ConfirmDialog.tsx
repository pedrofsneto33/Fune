'use client';

import { AlertTriangle } from 'lucide-react';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

/**
 * Modal de confirmacao customizado para substituir window.confirm().
 * Bloqueia a operacao de forma intencional, porem com a identidade visual do sistema.
 */
export function ConfirmDialog({
  request,
  onClose,
}: {
  request: ConfirmRequest | null;
  onClose: () => void;
}) {
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={`w-5 h-5 ${request.danger ? 'text-red-400' : 'text-amber-400'}`}
          />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{request.title}</h3>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
          {request.message}
        </p>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              request.onConfirm();
              onClose();
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white transition ${
              request.danger
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {request.confirmLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
