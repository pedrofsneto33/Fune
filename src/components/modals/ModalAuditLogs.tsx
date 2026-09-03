'use client';
import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, History } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

interface AuditLog {
  id: string;
  action: string;
  user_email: string;
  details: string;
  created_at: string;
}

export function ModalAuditLogs({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchLogs();
  }, [isOpen]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/audit-logs');
      if (!res.ok) {
        setError('Não foi possível carregar os logs de auditoria.');
        setLogs([]);
        return;
      }
      const data = await res.json();
      setLogs(data.logs || data || []);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
      setError('Erro ao carregar logs de auditoria.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">Trilha de Auditoria Forense & Logs de Segurança</h2>
              <p className="text-xs text-zinc-400">Monitoramento em tempo real de transações e acessos sensíveis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400 animate-pulse">Carregando registros de auditoria...</div>
          ) : error ? (
            <div className="py-12 text-center text-xs text-amber-400">{error}</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">Nenhum registro de auditoria encontrado.</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono font-bold text-[10px]">
                        {log.action}
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{log.user_email || 'sistema@eternitysos'}</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition">Fechar</button>
        </div>
      </div>
    </div>
  );
}
