'use client';

// Extraido de page.tsx (~2675). Reusa ModalChapel.
// Resolvido quando o monolito for removido na Fase 6.

import React, { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { notifyError, notifyInfo } from '@/lib/notify';
import { ModalChapel } from '@/components/modals/ModalChapel';
import type { ChapelBooking } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  reservado: 'Reservado',
  em_velorio: 'Em Velório',
  concluido: 'Concluído',
};

const STATUS_COLOR: Record<string, string> = {
  reservado: 'bg-amber-950 text-amber-300 border border-amber-800',
  em_velorio: 'bg-blue-950 text-blue-300 border border-blue-800',
  concluido: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
};

export default function ChapelTab() {
  const [bookings, setBookings] = useState<ChapelBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/chapel-bookings');
      const data = await res.json().catch(() => []);
      if (res.ok) setBookings(Array.isArray(data) ? data : []);
      else notifyError(data.error || 'Erro ao carregar reservas');
    } catch {
      notifyError('Erro de conexão ao carregar reservas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleDelete = async (id: string) => {
    if (!confirm('Cancelar esta reserva de capela?')) return;
    const res = await authFetch(`/api/chapel-bookings?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
      notifyInfo('Reserva cancelada.');
    } else {
      notifyError('Não foi possível cancelar a reserva.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Salas de Velório & Capelas
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            {bookings.length} reserva(s) agendada(s)
          </p>
        </div>
        <button
          onClick={() => setIsNewOpen(true)}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow"
        >
          + Nova Reserva
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma reserva agendada.</p>
      ) : (
        <div className="bg-[#0d121f] border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Capela</th>
                <th className="py-3 px-4">Falecido</th>
                <th className="py-3 px-4">Contato Família</th>
                <th className="py-3 px-4">Início</th>
                <th className="py-3 px-4">Término</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-700 dark:text-slate-200">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-200 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {b.chapel_name}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{b.deceased_name}</td>
                  <td className="py-3 px-4 text-slate-400">{b.family_contact}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(b.start_time).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(b.end_time).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLOR[b.status]}`}>
                      {STATUS_LABEL[b.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalChapel
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onSuccess={loadBookings}
      />
    </div>
  );
}