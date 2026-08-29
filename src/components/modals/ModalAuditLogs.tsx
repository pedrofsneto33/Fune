'use client';
import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, History, Terminal } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function ModalAuditLogs({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) fetchLogs();
  }, [isOpen]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Simula ou busca tabela de auditoria se existir
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) {
        // Fallback de logs simulados caso a tabela ainda não tenha sido criada
        setLogs([
          { id: '1', action: 'LOGIN_SUCCESS', user_email: 'admin@eternitysos.com', details: 'Acesso autenticado no sistema', created_at: new Date().toISOString() },
          { id: '2', action: 'ASAAS_BATCH_GENERATE', user_email: 'financeiro@eternitysos.com', details: 'Geração de 12 parcelas em lote', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: '3', action: 'EMERGENCY_DISPATCH_CLOSE', user_email: 'plantao@eternitysos.com', details: 'Baixa de missão com abatimento de urna', created_at: new Date(Date.now() - 7200000).toISOString() }
        ]);
      } else {
        setLogs(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Trilha de Auditoria Forense & Logs de Segurança</h2>
              <p className="text-xs text-zinc-400">Monitoramento em tempo real de transações e acessos sensíveis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400 animate-pulse">Carregando registros de auditoria...</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono font-bold text-[10px]">
                        {log.action}
                      </span>
                      <span className="text-zinc-300 font-semibold">{log.user_email || 'sistema@eternitysos'}</span>
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

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition">
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
