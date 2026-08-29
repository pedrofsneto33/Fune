'use client';

import React from 'react';
import { UserPlus, X } from 'lucide-react';

interface ModalNewHolderProps {
  isOpen: boolean;
  onClose: () => void;
  fullName: string;
  setFullName: (val: string) => void;
  cpf: string;
  setCpf: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  selectedPlan: string;
  setSelectedPlan: (val: string) => void;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
}

export function ModalNewHolder({
  isOpen,
  onClose,
  fullName,
  setFullName,
  cpf,
  setCpf,
  phone,
  setPhone,
  selectedPlan,
  setSelectedPlan,
  saving,
  onSave
}: ModalNewHolderProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <UserPlus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cadastrar Novo Associado</h3>
              <p className="text-xs text-zinc-400">Emissão de contrato e inclusão cadastral</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs mt-4">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Nome Completo do Titular *</label>
            <input
              type="text"
              required
              placeholder="Ex: Raimundo Nonato da Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">CPF *</label>
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">WhatsApp / Telefone *</label>
              <input
                type="text"
                required
                placeholder="(86) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Plano Funerário *</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="Familiar Ouro">Familiar Ouro - R$ 45,00/mês</option>
              <option value="Familiar Prata">Familiar Prata - R$ 35,00/mês</option>
              <option value="Individual Master">Individual Master - R$ 25,00/mês</option>
              <option value="Executivo Diamante">Executivo Diamante - R$ 75,00/mês</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
            >
              {saving ? 'Gravando...' : 'Cadastrar e Ativar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}