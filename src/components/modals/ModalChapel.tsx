'use client';
import React, { useState } from 'react';
import { X, Building2 } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

/**
 * LIMITAÇÃO conhecida: a lista de salas é fixa (hardcoded).
 * Idealmente viraria uma tabela `chapel_rooms` ou `/api/chapel-bookings/rooms`.
 * Para a SAAD/Fune, estas 3 salas cobrem o uso atual.
 */
const CHAPEL_ROOMS = ['Capela Master 01 (Suíte)', 'Capela Executiva 02', 'Capela Standard 03'];

function toDatetimeLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ModalChapel({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [chapelName, setChapelName] = useState(CHAPEL_ROOMS[0]);
  const [deceasedName, setDeceasedName] = useState('');
  const [familyContact, setFamilyContact] = useState('');
  const [startTime, setStartTime] = useState(() => toDatetimeLocal(new Date().toISOString()));
  const [endTime, setEndTime] = useState(() => toDatetimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()));
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
        try {
      const res = await authFetch('/api/chapel-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapel_name: chapelName,
          deceased_name: deceasedName,
          family_contact: familyContact,
          start_time: startTime ? new Date(startTime).toISOString() : undefined,
          end_time: endTime ? new Date(endTime).toISOString() : undefined,
          status: 'reservado',
        }),
      });
      if (!res.ok) throw new Error("Erro ao agendar capela");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      notifyError('Erro ao agendar capela: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" /> Agendamento de Capela & Velório
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Selecionar Capela</label>
                        <select value={chapelName} onChange={e => setChapelName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white">
              {CHAPEL_ROOMS.map((room) => <option key={room} value={room}>{room}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Nome do Falecido</label>
            <input required type="text" value={deceasedName} onChange={e => setDeceasedName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
                    <div>
            <label className="text-xs text-zinc-400 block mb-1">Contato da Família (Responsável)</label>
            <input type="text" value={familyContact} onChange={e => setFamilyContact(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Início (data e hora)</label>
            <input required type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Fim (data e hora)</label>
            <input required type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <button disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition">
            {loading ? 'Agendando...' : 'Confirmar Reserva'}
          </button>
        </form>
      </div>
    </div>
  );
}
