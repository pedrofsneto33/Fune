'use client';

import { notifySuccess, notifyError } from '@/lib/notify';
import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

interface WebhookEvent {
  id: string;
  tenant_id: string;
  provider: string;
  event: string;
  asaas_payment_id: string;
  processed: boolean;
  skipped_reason: string | null;
  retry_count: number;
  last_retried_at: string | null;
  retry_error: string | null;
  received_at: string;
  processed_at: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_RETRIES = 5;

function StatusBadge({ e }: { e: WebhookEvent }) {
  if (e.processed) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
        <CheckCircle className="w-3 h-3" /> Processado
      </span>
    );
  }
  if (e.retry_count > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
        <RefreshCw className="w-3 h-3" /> Retry {e.retry_count}/{MAX_RETRIES}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-bold">
      <XCircle className="w-3 h-3" /> Pendente
    </span>
  );
}

function FilterBtn({ active, onClick, className, children }: { active: boolean; onClick: () => void; className: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${active ? `${className} text-white` : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
    >
      {children}
    </button>
  );
}

export function ModalWebhookRetry({ isOpen, onClose }: Props) {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unprocessed' | 'processed'>('unprocessed');
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (filter !== 'all') {
        params.set('processed', filter === 'processed' ? 'true' : 'false');
      }
      const res = await authFetch(`/api/webhooks/events?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setTotal(data.total || 0);
      }
    } catch {
      notifyError('Erro ao carregar eventos.');
    } finally {
      setLoading(false);
    }
  }, [filter, offset]);

  useEffect(() => {
    if (isOpen) loadEvents();
  }, [isOpen, loadEvents]);

  const handleRetry = async (eventId: string) => {
    setRetryingId(eventId);
    try {
      const res = await authFetch('/api/webhooks/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notifySuccess('✅ Evento reprocessado com sucesso!');
      } else {
        notifyError(`Falha: ${data.error || 'Erro desconhecido'}`);
      }
      loadEvents();
    } catch {
      notifyError('Erro de conexão.');
    } finally {
      setRetryingId(null);
    }
  };

  const fmt = (d: string | null) => d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }) : '—';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60]">
      <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col text-slate-900 dark:text-white shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-cyan-400">🔄 Retry Manual de Webhooks</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{total} evento(s)</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg transition"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="flex items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-800">
          <FilterBtn active={filter === 'unprocessed'} onClick={() => { setFilter('unprocessed'); setOffset(0); }} className="bg-red-600">Pendentes</FilterBtn>
          <FilterBtn active={filter === 'processed'} onClick={() => { setFilter('processed'); setOffset(0); }} className="bg-emerald-600">Processados</FilterBtn>
          <FilterBtn active={filter === 'all'} onClick={() => { setFilter('all'); setOffset(0); }} className="bg-slate-500">Todos</FilterBtn>
          <div className="flex-1" />
          <button onClick={loadEvents} disabled={loading} className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}Atualizar
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && events.length === 0 ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
              <p className="text-sm text-slate-300">Nenhum evento pendente.</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-500 uppercase">
                <tr>
                  <th className="py-2 px-3 text-left">Evento</th>
                  <th className="py-2 px-3 text-left">Pagamento</th>
                  <th className="py-2 px-3 text-left">Recebido</th>
                  <th className="py-2 px-3 text-left">Status</th>
                  <th className="py-2 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3"><div className="font-mono text-cyan-400 text-[10px]">{e.event || 'N/A'}</div></td>
                    <td className="py-2 px-3 font-mono text-[10px] text-slate-400">{e.asaas_payment_id?.slice(0, 8) || '—'}</td>
                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap"><div className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(e.received_at)}</div></td>
                    <td className="py-2 px-3"><StatusBadge e={e} /></td>
                    <td className="py-2 px-3 text-right">
                      {!e.processed && e.retry_count < MAX_RETRIES && (
                        <button onClick={() => handleRetry(e.id)} disabled={retryingId === e.id} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold disabled:opacity-50 flex items-center gap-1 ml-auto">
                          {retryingId === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}Reenviar
                        </button>
                      )}
                      {e.retry_error && <div className="text-[9px] text-red-400 mt-1">{e.retry_error.slice(0, 40)}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex items-center justify-between p-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500">{offset + 1}-{Math.min(offset + LIMIT, total)} de {total}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs disabled:opacity-50">Anterior</button>
            <button onClick={() => setOffset(offset + LIMIT)} disabled={offset + LIMIT >= total} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs disabled:opacity-50">Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
}
