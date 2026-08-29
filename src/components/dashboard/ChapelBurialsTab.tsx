'use client';

import React, { useState, useEffect } from 'react';
import {
  Church,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  Flame,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Printer
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

export function ChapelBurialsTab() {
  const { currentTenant } = useTenant();
  const [rooms, setRooms] = useState<any[]>([]);
  const [burials, setBurials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'burials' | 'rooms'>('burials');

  // Modal Agendamento
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [deceasedName, setDeceasedName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [wakeStart, setWakeStart] = useState('');
  const [wakeEnd, setWakeEnd] = useState('');
  const [cemeteryName, setCemeteryName] = useState('');
  const [cemeteryPlot, setCemeteryPlot] = useState('');
  const [burialType, setBurialType] = useState('Sepultamento Tradicional');
  const [concessionType, setConcessionType] = useState('Perpétua');
  const [burialDate, setBurialDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chapel/burials?tenant_id=${currentTenant?.id || 'matriz'}`);
      const data = await res.json();
      setRooms(data.rooms || []);
      setBurials(data.burials || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTenant]);

  const handleCreateBurial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/chapel/burials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant?.id || 'matriz',
          deceased_name: deceasedName,
          room_id: roomId || null,
          wake_start: wakeStart,
          wake_end: wakeEnd,
          cemetery_name: cemeteryName,
          cemetery_plot: cemeteryPlot,
          burial_type: burialType,
          concession_type: concessionType,
          burial_date: burialDate,
          observations
        })
      });

      if (res.ok) {
        setIsNewModalOpen(false);
        setDeceasedName('');
        setCemeteryName('');
        setCemeteryPlot('');
        setWakeStart('');
        setWakeEnd('');
        setObservations('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = burials.filter((b) =>
    (b.deceased_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.cemetery_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Church className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Salas de Velório & Sepultamentos</h2>
            <p className="text-xs text-zinc-400">Gestão de capelas, cortejos, jazigos e controle legal de exumações.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveSubTab('burials')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'burials' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cerimônias & Sepultamentos ({burials.length})
            </button>
            <button
              onClick={() => setActiveSubTab('rooms')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'rooms' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Capelas & Salas ({rooms.length})
            </button>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Agendar Cerimônia
          </button>
        </div>
      </div>

      {/* Grid de Status das Capelas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {rooms.map((r, idx) => (
          <div key={idx} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2 shadow-md">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-white text-sm">{r.name}</h4>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  r.status === 'Disponível'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {r.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400">Capacidade: {r.capacity} pessoas</p>
          </div>
        ))}
      </div>

      {/* Tabela de Sepultamentos e Velórios */}
      {activeSubTab === 'burials' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por falecido ou cemitério..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Falecido / Sala</th>
                  <th className="py-3 px-4">Horário do Velório / Saída</th>
                  <th className="py-3 px-4">Cemitério & Localização do Jazigo</th>
                  <th className="py-3 px-4">Concessão / Exumação Elegível</th>
                  <th className="py-3 px-4">Tipo / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500 italic">
                      Nenhum agendamento de cerimonial/sepultamento cadastrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{b.deceased_name}</p>
                        <span className="text-[11px] text-indigo-400">{b.wake_rooms?.name || 'Velório Domiciliar'}</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        <p>Início: {new Date(b.wake_start).toLocaleString('pt-BR')}</p>
                        <p className="text-[11px] text-zinc-400">Saída Féretro: {new Date(b.wake_end).toLocaleString('pt-BR')}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-white font-medium">{b.cemetery_name}</p>
                        <p className="text-[11px] text-zinc-400 font-mono">{b.cemetery_plot}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-zinc-300 font-medium">{b.concession_type}</p>
                        <p className="text-[10px] text-zinc-500">Exumação a partir de: {b.exhumation_eligible_date}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {b.burial_type}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Agendar Cerimônia */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Church className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Agendamento de Velório & Sepultamento</h3>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateBurial} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-300 font-semibold mb-1">Nome do Falecido *</label>
                  <input
                    type="text"
                    required
                    value={deceasedName}
                    onChange={(e) => setDeceasedName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Capela / Sala de Velório</label>
                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Velório Residencial / Outro --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.status})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Tipo de Cerimônia</label>
                  <select
                    value={burialType}
                    onChange={(e) => setBurialType(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Sepultamento Tradicional">Sepultamento Tradicional</option>
                    <option value="Cremação">Cremação</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Início do Velório *</label>
                  <input
                    type="datetime-local"
                    required
                    value={wakeStart}
                    onChange={(e) => setWakeStart(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Saída do Féretro / Cortejo *</label>
                  <input
                    type="datetime-local"
                    required
                    value={wakeEnd}
                    onChange={(e) => setWakeEnd(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Cemitério / Crematório de Destino *</label>
                  <input
                    type="text"
                    required
                    value={cemeteryName}
                    onChange={(e) => setCemeteryName(e.target.value)}
                    placeholder="Ex: Cemitério São Judas Tadeu"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Mapeamento do Jazigo *</label>
                  <input
                    type="text"
                    required
                    value={cemeteryPlot}
                    onChange={(e) => setCemeteryPlot(e.target.value)}
                    placeholder="Ex: Quadra 04, Lote 12, Gaveta 01"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Tipo de Concessão</label>
                  <select
                    value={concessionType}
                    onChange={(e) => setConcessionType(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Perpétua">Concessão Perpétua</option>
                    <option value="Temporária (3 Anos)">Temporária (Gaveta Aluguel - 3 Anos)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Data do Sepultamento *</label>
                  <input
                    type="date"
                    required
                    value={burialDate}
                    onChange={(e) => setBurialDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Instruções de Cerimonial</label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Música em violino, celebração religiosa, homenagens especiais..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !deceasedName || !cemeteryName}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Agendando...' : 'Confirmar Agendamento de Cerimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}