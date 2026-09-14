// API orfa — UI nova criada na Fase 5c-2 (nao existe codigo em page.tsx
// para copiar). Trilha de auditoria: GET /api/audit-logs, READ-ONLY,
// restrito a superadmin/admin (403 mostra aviso).

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AuditLog } from '@/types/domain';
import { authFetch } from '@/lib/authFetch';
import { notifyError } from '@/lib/notify';

function detailsText(d: AuditLog['details']): string {
  if (d == null) return '—';
  if (typeof d === 'string') return d;
  try {
    return JSON.stringify(d);
  } catch {
    return '—';
  }
}

export default function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const res = await authFetch('/api/audit-logs');
        if (res.status === 403) {
          if (!cancel) setForbidden(true);
          return;
        }
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data) ? data : data?.logs || [];
        if (!cancel) setLogs(list);
      } catch {
        if (!cancel) notifyError('Erro ao carregar trilha de auditoria.');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const actions = useMemo(
    () => Array.from(new Set(logs.map((l) => l.action).filter(Boolean))).sort(),
    [logs],
  );

  const filtered = useMemo(
    () => (actionFilter ? logs.filter((l) => l.action === actionFilter) : logs),
    [logs, actionFilter],
  );

  if (forbidden) {
    return (
      <div className="p-6">
        <p className="text-sm text-amber-300">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <section>
        <h2 className="text-lg font-bold text-white">Trilha de auditoria</h2>
        <p className="text-xs text-slate-400">
          Fonte: GET /api/audit-logs (somente leitura, ultimos 100 eventos).
        </p>
        <div className="mt-3 flex items-center gap-2">
          <label className="text-xs text-slate-400" htmlFor="audit-action">
            Acao:
          </label>
          <select
            id="audit-action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
          >
            <option value="">Todas</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="mt-3 text-xs text-slate-400">Carregando…</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full text-xs text-slate-200">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Data/Hora</th>
                  <th className="px-3 py-2 text-left">Usuario</th>
                  <th className="px-3 py-2 text-left">Acao</th>
                  <th className="px-3 py-2 text-left">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const full = detailsText(l.details);
                  const short = full.length > 80 ? `${full.slice(0, 80)}…` : full;
                  return (
                    <tr key={l.id} className="border-t border-slate-800">
                      <td className="px-3 py-2 whitespace-nowrap">{l.created_at || '—'}</td>
                      <td className="px-3 py-2">{l.user_email || '—'}</td>
                      <td className="px-3 py-2">{l.action}</td>
                      <td className="px-3 py-2 max-w-xs truncate" title={full}>
                        {short}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr className="border-t border-slate-800">
                    <td className="px-3 py-4 text-center text-slate-500" colSpan={4}>
                      Nenhum evento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}