'use client';

import { useState, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch';
import { notifySuccess, notifyError } from '@/lib/notify';

// ============================================================================
// useBilling — hook de cobrança (piloto: lote Asaas)
// Incrementa: um handler de cobrança por vez, saindo do page.tsx.
// ============================================================================

export interface UseBillingReturn {
  // Estados do lote Asaas
  asaasDueDate: string;
  setAsaasDueDate: (v: string) => void;
  asaasBillingType: string;
  setAsaasBillingType: (v: string) => void;
  asaasBatchHolderId: string;
  setAsaasBatchHolderId: (v: string) => void;
  asaasBatchRunning: boolean;

  // Ações
  handleGenerateAsaasBatch: () => Promise<void>;
}

export function useBilling(onSuccess?: () => void): UseBillingReturn {
  const [asaasDueDate, setAsaasDueDate] = useState('');
  const [asaasBillingType, setAsaasBillingType] = useState('BOLETO');
  const [asaasBatchHolderId, setAsaasBatchHolderId] = useState('');
  const [asaasBatchRunning, setAsaasBatchRunning] = useState(false);

  const handleGenerateAsaasBatch = useCallback(async () => {
    setAsaasBatchRunning(true);
    try {
      const res = await authFetch('/api/billing/asaas-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDate: asaasDueDate || undefined,
          billingType: asaasBillingType,
          holderId: asaasBatchHolderId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data as any).success) {
        const erros = ((data as any).results || []).filter(
          (r: any) => r.status !== 'created',
        );
        let extra = '';
        if (erros.length > 0) {
          extra =
            '\n\nAtenção:\n' +
            erros
              .slice(0, 5)
              .map((r: any) => `• ${r.holder}: ${r.error}`)
              .join('\n');
        }
        notifySuccess(
          `✅ Asaas: ${(data as any).message || 'Lote processado!'}${extra}`,
        );
        if (onSuccess) onSuccess();
      } else {
        notifyError(
          `Erro Asaas: ${(data as any).error || 'Falha ao processar lote'}`,
        );
      }
    } catch {
      notifyError('Erro de conexão ao processar lote Asaas.');
    } finally {
      setAsaasBatchRunning(false);
    }
  }, [asaasDueDate, asaasBillingType, asaasBatchHolderId, onSuccess]);

  return {
    asaasDueDate,
    setAsaasDueDate,
    asaasBillingType,
    setAsaasBillingType,
    asaasBatchHolderId,
    setAsaasBatchHolderId,
    asaasBatchRunning,
    handleGenerateAsaasBatch,
  };
}
