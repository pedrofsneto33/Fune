'use client';
import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

export function ModalCollectorRoute({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [collectorName, setCollectorName] = useState('');
  const [zone, setZone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authFetch('/api/collector-routes', {
        method: 'POST',
        body: JSON.stringify({
          collector_name: collectorName,
          zone: zone,
          status: 'ativo',
          total_receipts: 0,
        }),
      });
      if (!res.ok) throw new Error("Erro ao criar rota");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      notifyError('Erro ao criar rota: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" /> Nova Rota de Cobrança Presencial
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Nome do Cobrador / Operador</label>
            <input required type="text" value={collectorName} onChange={e => setCollectorName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Zona / Bairro Atendido</label>
            <input required type="text" value={zone} onChange={e => setZone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" placeholder="Ex: Zona Norte - Bairro Itararé" />
          </div>
          <button disabled={loading} className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition">
            {loading ? 'Criando...' : 'Cadastrar Rota de Cobrança'}
          </button>
        </form>
      </div>
    </div>
  );
}
