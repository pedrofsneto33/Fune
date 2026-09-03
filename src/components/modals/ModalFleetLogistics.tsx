'use client';
import React, { useState, useEffect } from 'react';
import { X, Truck, PlusCircle, RefreshCw } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { notifyError } from '@/lib/notify';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  status: string;
  odometer: number;
}

export function ModalFleetLogistics({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [newOdometer, setNewOdometer] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadVehicles();
    }
  }, [isOpen]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data || []);
        if (data.length > 0) setSelectedVehicleId(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar veículos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOdometer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) return;
    setLoading(true);
    try {
      const res = await authFetch(`/api/vehicles?id=${selectedVehicleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ odometer: parseInt(newOdometer) }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar hodômetro');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      notifyError('Erro ao atualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <h3 className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-400" /> Controle de Frota
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {loading ? (
          <div className="text-center text-xs text-zinc-500 py-8">Carregando frota...</div>
        ) : vehicles.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 py-8">Nenhum veículo cadastrado</div>
        ) : (
          <form onSubmit={handleUpdateOdometer} className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Veículo</label>
              <select value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white">
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Hodômetro Atual (km)</label>
              <input required type="number" value={newOdometer} onChange={e => setNewOdometer(e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white" />
            </div>
            <button disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white dark:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> {loading ? 'Atualizando...' : 'Atualizar Hodômetro'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
