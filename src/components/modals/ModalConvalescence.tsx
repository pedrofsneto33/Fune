'use client';
import React, { useState } from 'react';
import { X, HeartHandshake } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function ModalConvalescence({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [equipment, setEquipment] = useState('Cadeira de Rodas');
  const [beneficiary, setBeneficiary] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('convalescence_loans').insert([
        { equipment_name: equipment, borrower_name: beneficiary, borrower_phone: phone, status: 'emprestado' }
      ]);
      if (error) throw error;
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      notifyError('Erro ao registrar empréstimo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-400" /> Empréstimo de Equipamentos (Convalescença)
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Equipamento Médico</label>
            <select value={equipment} onChange={e => setEquipment(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white">
              <option value="Cadeira de Rodas">Cadeira de Rodas</option>
              <option value="Cadeira de Banho">Cadeira de Banho</option>
              <option value="Muletas (Par)">Muletas (Par)</option>
              <option value="Cama Hospitalar">Cama Hospitalar</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Nome do Beneficiário / Solicitante</label>
            <input required type="text" value={beneficiary} onChange={e => setBeneficiary(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Telefone de Contato</label>
            <input required type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <button disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition">
            {loading ? 'Registrando...' : 'Registrar Empréstimo'}
          </button>
        </form>
      </div>
    </div>
  );
}
