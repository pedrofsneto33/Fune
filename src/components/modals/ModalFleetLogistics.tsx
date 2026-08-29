'use client';
import React, { useState } from 'react';
import { X, Truck, Navigation, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function ModalFleetLogistics({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [vehicle, setVehicle] = useState('Furgão Fatorial 01 (Placa: ABC-1234)');
  const [driver, setDriver] = useState('');
  const [missionId, setMissionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAssignVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // Atualiza status do veículo na tabela de frota ou registra missão logística
      const { error } = await supabase.from('fleet_vehicles').update({ status: 'em_missao' }).eq('plate', 'ABC-1234');
      
      // Registra log de auditoria da alocação
      await supabase.from('audit_logs').insert([
        { action: 'FLEET_MISSION_ASSIGN', user_email: 'plantao@eternitysos.com', details: `Veículo ${vehicle} alocado para motorista ${driver}` }
      ]);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      alert('Erro ao alocar frota: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Logística de Frota & Alocação de Óbitos</h2>
              <p className="text-xs text-zinc-400">Gerenciamento de veículos de translado e prontidão de equipes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleAssignVehicle} className="p-6 space-y-4">
          {success && (
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center gap-2 text-cyan-400 text-xs">
              <CheckCircle2 className="w-4 h-4" /> Veículo alocado com sucesso para a missão!
            </div>
          )}

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Selecionar Veículo / Furgão</label>
            <select 
              value={vehicle} 
              onChange={e => setVehicle(e.target.value)} 
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
            >
              <option value="Furgão Fatorial 01 (Placa: ABC-1234)">Furgão Fatorial 01 (Placa: ABC-1234)</option>
              <option value="Cornoftal Executivo 02 (Placa: XYZ-5678)">Cornoftal Executivo 02 (Placa: XYZ-5678)</option>
              <option value="Veículo de Apoio Logístico (Placa: DEF-9012)">Veículo de Apoio Logístico (Placa: DEF-9012)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Motorista / Socorrista Responsável</label>
            <input 
              required 
              type="text" 
              value={driver} 
              onChange={e => setDriver(e.target.value)} 
              placeholder="Nome do motorista de plantão" 
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" 
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">ID da Missão / Óbito Vinculado</label>
            <input 
              type="text" 
              value={missionId} 
              onChange={e => setMissionId(e.target.value)} 
              placeholder="Opcional: ID do plantão 24h" 
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono" 
            />
          </div>

          <button 
            disabled={loading} 
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            {loading ? 'Processando Alocação...' : 'Confirmar Saída do Veículo'}
          </button>
        </form>

      </div>
    </div>
  );
}
