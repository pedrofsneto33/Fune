'use client';
import React, { useState } from 'react';
import { X, FileText, PlusCircle } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

export function ModalContractEngine({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [holderName, setHolderName] = useState('');
  const [plan, setPlan] = useState('');
  const [value, setValue] = useState('');
  const [startDate, setStartDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authFetch('/api/contracts', {
        method: 'POST',
        body: JSON.stringify({
          holder_name: holderName,
          plan_name: plan,
          monthly_amount: parseFloat(value),
          start_date: startDate,
          status: 'ativo',
        }),
      });
      if (!res.ok) throw new Error('Erro ao criar contrato');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      notifyError('Erro ao criar contrato: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" /> Gerar Novo Contrato
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Nome do Associado</label>
            <input required type="text" value={holderName} onChange={e => setHolderName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Plano</label>
            <input required type="text" value={plan} onChange={e => setPlan(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" placeholder="Ex: Essencial" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Valor Mensal (R$)</label>
            <input required type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Data de Início</label>
            <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <button disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5">
            <PlusCircle className="w-4 h-4" /> {loading ? 'Gerando...' : 'Gerar Contrato'}
          </button>
        </form>
      </div>
    </div>
  );
}
