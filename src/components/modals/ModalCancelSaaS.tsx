'use client';
import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifySuccess } from '@/lib/notify';

/**
 * Fase 4c — cancelar assinatura SaaS de um tenant (superadmin).
 * Segue o padrao do ModalChapel (overlay + card + submit via authFetch).
 */

export interface SaasTenantToCancel {
  id: string;
  name: string | null;
}

export function ModalCancelSaaS({
  isOpen,
  onClose,
  onSuccess,
  tenant,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tenant: SaasTenantToCancel;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await authFetch('/api/saas/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data as { error?: string }).error || 'Erro ao cancelar assinatura.';
        setError(msg);
        notifyError(msg);
        return;
      }
      notifySuccess('Assinatura cancelada.');
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      setError('Erro de conexão ao cancelar assinatura.');
      notifyError('Erro de conexão ao cancelar assinatura.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <h3 className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Cancelar assinatura
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-xs text-red-400">{error}</p>}
          <p className="text-xs text-slate-900 dark:text-white">
            Cancelar assinatura de <span className="font-bold">{tenant.name || tenant.id}</span>?
          </p>
          <p className="text-xs text-red-400">Essa acao nao pode ser desfeita.</p>
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
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-60"
            >
              {submitting ? 'Cancelando...' : 'Confirmar cancelamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalCancelSaaS;
