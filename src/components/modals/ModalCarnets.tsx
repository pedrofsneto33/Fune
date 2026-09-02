'use client';
import React, { useState } from 'react';
import { X, CreditCard, PlusCircle } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

export function ModalCarnets({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState('');
  const [holder, setHolder] = useState('');
  const [value, setValue] = useState('');
  const [dueDate, setDueDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authFetch('/api/payment-carnets', {
        method: 'POST',
        body: JSON.stringify({
          plan_name: plan,
          holder_name: holder,
          amount: parseFloat(value),
          due_date: dueDate,
          status: 'pendente',
        }),
      });
      if (!res.ok) throw new Error('Erro ao criar carne');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao criar carne: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-violet-400" /> Gerar Carnê de Pagamento
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Plano</label>
            <input required type="text" value={plan} onChange={e => setPlan(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" placeholder="Ex: Essencial" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Nome do Associado</label>
            <input required type="text" value={holder} onChange={e => setHolder(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Valor da Parcela (R$)</label>
            <input required type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Data de Vencimento</label>
            <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <button disabled={loading} className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5">
            <PlusCircle className="w-4 h-4" /> {loading ? 'Gerando...' : 'Gerar Carnê'}
          </button>
        </form>
      </div>
    </div>
  );
}
