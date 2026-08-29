'use client';

import React, { useEffect, useState } from 'react';
import { History, Clock, User, Truck, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: string;
  dispatch_id: string;
  action: string;
  actor_name: string;
  actor_role: string;
  vehicle_plate?: string | null;
  driver_name?: string | null;
  details?: Record<string, any>;
  created_at: string;
}

interface AuditTimelineProps {
  dispatchId: string;
  tenantId?: string;
}

export function AuditTimeline({ dispatchId, tenantId }: AuditTimelineProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (!dispatchId) return;
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.append('dispatch_id', dispatchId);
      if (tenantId) query.append('tenant_id', tenantId);

      const res = await fetch(`/api/dispatches/audit?${query.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao buscar histórico');
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar auditoria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [dispatchId, tenantId]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'DESPACHO_INICIADO':
        return { label: 'Despacho Iniciado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'VEICULO_DESIGNADO':
        return { label: 'Veículo Designado', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'CHEGADA_LOCAL':
        return { label: 'Chegada ao Local', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'FINALIZADO':
        return { label: 'Atendimento Concluído', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'CANCELADO':
        return { label: 'Atendimento Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      default:
        return { label: action.replace('_', ' '), color: 'bg-zinc-700/50 text-zinc-300 border-zinc-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 space-x-2 text-xs text-zinc-400">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
        <span>Carregando trilha de auditoria...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-zinc-500 italic bg-zinc-950/40 rounded-xl border border-zinc-800/60">
        Nenhum registro de auditoria gravado para este atendimento.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Trilha de Auditoria (Logs Imutáveis)</span>
        </div>
        <button
          onClick={fetchLogs}
          className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded transition text-xs flex items-center gap-1"
          title="Recarregar Logs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[10px]">Atualizar</span>
        </button>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
        {logs.map((log, index) => {
          const badge = getActionBadge(log.action);
          const dateFormatted = new Date(log.created_at).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          return (
            <div key={log.id || index} className="relative group">
              {/* Ponto na timeline */}
              <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-zinc-900 group-hover:scale-125 transition" />

              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 space-y-2 hover:border-zinc-700 transition shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                    {badge.label}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>{dateFormatted}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Operador: <strong className="text-white">{log.actor_name}</strong> <span className="text-[10px] text-zinc-400">({log.actor_role})</span></span>
                  </div>
                  {log.vehicle_plate && (
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Truck className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Veículo: <strong className="text-white">{log.vehicle_plate}</strong></span>
                    </div>
                  )}
                  {log.driver_name && (
                    <div className="flex items-center gap-1.5 text-zinc-300 col-span-full">
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Agente / Motorista: <strong className="text-white">{log.driver_name}</strong></span>
                    </div>
                  )}
                </div>

                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/50 text-[11px] text-zinc-400 space-y-1 mt-1">
                    {log.details.deceased_name && (
                      <p>Falecido: <span className="text-zinc-200 font-medium">{log.details.deceased_name}</span></p>
                    )}
                    {log.details.death_location && (
                      <p>Local: <span className="text-zinc-200">{log.details.death_location}</span></p>
                    )}
                    {log.details.address && (
                      <p>Endereço: <span className="text-zinc-200">{log.details.address}</span></p>
                    )}
                    {log.details.urn_model && (
                      <p>Urna: <span className="text-zinc-200">{log.details.urn_model}</span></p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}