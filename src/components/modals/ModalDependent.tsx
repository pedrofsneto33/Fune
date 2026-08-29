'use client';

import React from 'react';
import { X, UserPlus, Users, Trash2, Calendar, ShieldCheck } from 'lucide-react';

export interface DependentItem {
  id: string;
  full_name: string;
  cpf?: string;
  relation: string;
  birth_date?: string;
}

interface ModalDependentProps {
  isOpen: boolean;
  onClose: () => void;
  holder: {
    id: string;
    holderId: string;
    holder: string;
    cpf: string;
    plan: string;
  } | null;
  dependents: DependentItem[];
  depName: string;
  setDepName: (val: string) => void;
  depKinship: string;
  setDepKinship: (val: string) => void;
  depBirth: string;
  setDepBirth: (val: string) => void;
  onAddDependent: (e: React.FormEvent) => void;
  onDeleteDependent?: (dependentId: string) => void;
}

export function ModalDependent({
  isOpen,
  onClose,
  holder,
  dependents,
  depName,
  setDepName,
  depKinship,
  setDepKinship,
  depBirth,
  setDepBirth,
  onAddDependent,
  onDeleteDependent
}: ModalDependentProps) {
  if (!isOpen || !holder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Dependentes do Associado</h2>
              <p className="text-xs text-zinc-400">
                Titular: <span className="text-zinc-200 font-medium">{holder.holder}</span> ({holder.cpf}) — Plano: <span className="text-emerald-400 font-medium">{holder.plan}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Form de Adição */}
          <form onSubmit={onAddDependent} className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              Cadastrar Novo Dependente
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do dependente"
                  value={depName}
                  onChange={(e) => setDepName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Grau de Parentesco *</label>
                <select
                  value={depKinship}
                  onChange={(e) => setDepKinship(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="Cônjuge">Cônjuge</option>
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Pai/Mãe">Pai/Mãe</option>
                  <option value="Sogro(a)">Sogro(a)</option>
                  <option value="Irmão(ã)">Irmão(ã)</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400 mb-1 block">Data de Nascimento</label>
                <input
                  type="date"
                  value={depBirth}
                  onChange={(e) => setDepBirth(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition"
              >
                <UserPlus className="w-4 h-4" />
                Vincular Dependente
              </button>
            </div>
          </form>

          {/* Lista de Dependentes Ativos */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>Dependentes Cadastrados ({dependents.length})</span>
            </h3>

            {dependents.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl">
                <p className="text-xs text-zinc-500">Nenhum dependente vinculado a este titular.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dependents.map((dep) => (
                  <div
                    key={dep.id}
                    className="bg-zinc-950/40 border border-zinc-800/80 p-3.5 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{dep.full_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                          {dep.relation}
                        </span>
                        {dep.birth_date && (
                          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            {new Date(dep.birth_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>

                    {onDeleteDependent && (
                      <button
                        onClick={() => onDeleteDependent(dep.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"
                        title="Remover dependente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
