'use client';

import React, { useState } from 'react';
import { Truck, X, Gauge, Fuel, CheckCircle, AlertCircle, Calculator } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

interface ModalCloseDispatchProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: any | null;
  currentUserRole?: string;
  onSuccess?: () => void;
}

export function ModalCloseDispatch({
  isOpen,
  onClose,
  dispatch,
  currentUserRole = 'atendente',
  onSuccess
}: ModalCloseDispatchProps) {
  const { currentTenant } = useTenant();
  const [odometerEnd, setOdometerEnd] = useState<number | string>('');
  const [fuelLiters, setFuelLiters] = useState<number | string>('0');
  const [fuelCost, setFuelCost] = useState<number | string>('0');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !dispatch) return null;

  const odoStart = Number(dispatch.odometer_start || dispatch.initial_km || 0);
  const odoEndNum = Number(odometerEnd || 0);
  const kmCalculated = odoEndNum > odoStart && odoStart > 0 ? odoEndNum - odoStart : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (odoStart > 0 && odoEndNum < odoStart) {
      setError(`O odômetro final (${odoEndNum} KM) não pode ser inferior ao inicial (${odoStart} KM).`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/dispatches/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatch_id: dispatch.id,
          tenant_id: currentTenant?.id || dispatch.tenant_id,
          vehicle_id: dispatch.vehicle_id,
          odometer_end: odoEndNum,
          fuel_liters_added: Number(fuelLiters),
          fuel_cost: Number(fuelCost),
          notes,
          closed_by: currentUserRole === 'admin' ? 'Administrador' : 'Atendente de Plantão',
          user_role: currentUserRole
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao encerrar despacho');

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 my-8">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Retorno à Base & Fechamento de OS</h3>
              <p className="text-xs text-zinc-400 font-mono">OS: #{dispatch.id.toString().slice(-6)} - {dispatch.deceased_name || dispatch.deceasedName || 'Atendimento'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Informações da Viagem */}
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 grid grid-cols-2 gap-2 text-zinc-300">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Veículo / Placa</span>
              <strong className="text-white text-xs">{dispatch.vehicle_plate || dispatch.vehicle || 'Veículo Designado'}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Motorista / Agente</span>
              <strong className="text-white text-xs">{dispatch.driver_agent || dispatch.driverName || 'Não informado'}</strong>
            </div>
            <div className="col-span-2 pt-1 border-t border-zinc-800/50 flex justify-between items-center">
              <span className="text-zinc-400">Odômetro de Saída:</span>
              <span className="font-mono text-white font-bold">{odoStart.toLocaleString('pt-BR')} KM</span>
            </div>
          </div>

          {/* Odômetro Final */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              Odômetro de Retorno (KM Final) *
            </label>
            <input
              type="number"
              required
              min={odoStart}
              placeholder={`Ex: ${odoStart + 15}`}
              value={odometerEnd}
              onChange={(e) => setOdometerEnd(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
          </div>

          {/* Cálculo de KM percorrido */}
          {odoEndNum > 0 && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between text-blue-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <Calculator className="w-4 h-4" />
                Distância Percorrida:
              </span>
              <span className="text-base font-mono font-bold">{kmCalculated} KM</span>
            </div>
          )}

          {/* Combustível / Abastecimento */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1 flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
                Combustível (Litros)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={fuelLiters}
                onChange={(e) => setFuelLiters(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Custo Abastecimento (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={fuelCost}
                onChange={(e) => setFuelCost(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Observações de Encerramento */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Observações / Avarias / Ocorrências</label>
            <textarea
              rows={2}
              placeholder="Ex: Veículo retornado limpo, sem avarias. Atendimento finalizado no cemitério municipal."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !odometerEnd}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? 'Finalizando...' : 'Encerrar Despacho & Liberar Veículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}