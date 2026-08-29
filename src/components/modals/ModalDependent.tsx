'use client';

import React from 'react';
import { Users, X } from 'lucide-react';

interface ModalDependentProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHolder: any | null;
  dependentsList: any[];
  depName: string;
  setDepName: (val: string) => void;
  depKinship: string;
  setDepKinship: (val: string) => void;
  depBirth: string;
  setDepBirth: (val: string) => void;
  saving: boolean;
  onAdd: (e: React.FormEvent) => void;
}

export function ModalDependent({
  isOpen,
  onClose,
  selectedHolder,
  dependentsList,
  depName,
  setDepName,
  depKinship,
  setDepKinship,
  depBirth,
  setDepBirth,
  saving,
  onAdd
}: ModalDependentProps) {
  if (!isOpen || !selectedHolder) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 my-8">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Dependentes do Plano</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
          <p className="text-zinc-400">Titular: <strong className="text-white">{selectedHolder.holder}</strong></p>
          <p className="text-zinc-400">Plano: <strong className="text-blue-400">{selectedHolder.plan}</strong></p>
        </div>

        {/* Lista de Dependentes Existentes */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-300">Dependentes Cadastrados:</h4>
          {dependentsList.length === 0 ? (
            <p className="text-xs text-zinc-500 italic">Nenhum dependente vinculado até o momento.</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {dependentsList.map((dep, idx) => (
                <div key={idx} className="flex justify-between items-center bg-zinc-800/60 px-3 py-2 rounded-lg text-xs">
                  <span className="text-white font-medium">{dep.name || dep.full_name}</span>
                  <span className="text-zinc-400 text-[11px]">{dep.kinship || dep.relationship}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulário de Inclusão */}
        <form onSubmit={onAdd} className="space-y-3 pt-3 border-t border-zinc-800 text-xs">
          <h4 className="font-semibold text-white">Adicionar Novo Dependente</h4>
          <div>
            <label className="block text-zinc-300 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              placeholder="Nome do dependente"
              value={depName}
              onChange={(e) => setDepName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 mb-1">Parentesco</label>
              <select
                value={depKinship}
                onChange={(e) => setDepKinship(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Conjuge">Cônjuge</option>
                <option value="Filho(a)">Filho(a)</option>
                <option value="Pai/Mae">Pai/Mãe</option>
                <option value="Sogro(a)">Sogro(a)</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-300 mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={depBirth}
                onChange={(e) => setDepBirth(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50"
            >
              {saving ? 'Gravando...' : 'Adicionar Dependente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}