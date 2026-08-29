'use client';
import React, { useState } from 'react';
import { X, Scissors, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function ModalTanatopraxy({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [deceasedName, setdeceasedName] = useState('');
  const [technician, setTechnician] = useState('');
  const [procedureType, setProcedureType] = useState('Tanatopraxia Completa');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('thanatopraxy_records').insert([
        { deceased_name: deceasedName, technician_name: technician, procedure_type: procedureType, status: 'concluido' }
      ]);
      if (error) throw error;
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar registro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Scissors className="w-4 h-4 text-purple-400" /> Registro de Tanatopraxia & Laboratório
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Nome do Falecido</label>
            <input required type="text" value={deceasedName} onChange={e => setdeceasedName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Tanatologista / Técnico Responsável</label>
            <input required type="text" value={technician} onChange={e => setTechnician(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Tipo de Procedimento</label>
            <select value={procedureType} onChange={e => setProcedureType(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white">
              <option value="Tanatopraxia Completa">Tanatopraxia Completa</option>
              <option value="Somatotopraxia (Conservação Simples)">Somatotopraxia (Conservação Simples)</option>
              <option value="Reconstrução Facial">Reconstrução Facial</option>
            </select>
          </div>
          <button disabled={loading} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition">
            {loading ? 'Salvando...' : 'Salvar Registro de Laboratório'}
          </button>
        </form>
      </div>
    </div>
  );
}
