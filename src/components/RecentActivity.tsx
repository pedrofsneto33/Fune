'use client';

// Fase 10c: atividade recente leve (slice client de /api/audit-logs).
// Endpoint retorna { logs: [...] } com limit 100 fixo e ignora ?limit —
// por isso usamos slice(0, 5) aqui. Roles sem acesso (403) recebem
// null silencioso para nao quebrar a home.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/authFetch';
import { AppRole, isTabAllowed } from '@/config/permissions';
import type { AuditLog } from '@/types/domain';

export default function RecentActivity({ role }: { role?: AppRole | null }) {
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await authFetch('/api/audit-logs');
        if (!res.ok) {
          if (!cancel) {
            setLogs(null);
            setLoading(false);
          }
          return;
        }
        const data = await res.json().catch(() => null);
        if (!cancel) {
          setLogs((data?.logs ?? []).slice(0, 5));
          setLoading(false);
        }
      } catch {
        if (!cancel) {
          setLogs(null);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="bg-white dark:bg-[#0d111a] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
        <p className="text-slate-600 dark:text-slate-400 text-xs">Carregando atividade…</p>
      </section>
    );
  }

  // Sem acesso (403) ou erro: nao renderiza nada.
  if (logs === null) return null;

  return (
    <section className="bg-white dark:bg-[#0d111a] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Atividade recente</h2>
        {role && isTabAllowed(role, 'audit') && (
          <Link href="/auditoria" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300">
            Ver tudo →
          </Link>
        )}
      </div>
      {logs.length === 0 ? (
        <p className="text-xs text-slate-600 dark:text-slate-400">Nenhuma atividade recente.</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-500 shrink-0">
                {new Date(log.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </span>
              <span className="text-slate-700 dark:text-slate-300 truncate">{log.user_email}</span>
              <span className="text-slate-600 dark:text-slate-400 truncate ml-auto">{log.action}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
