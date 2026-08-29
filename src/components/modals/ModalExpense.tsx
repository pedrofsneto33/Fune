'use client';

import React from 'react';
import { Fuel, X } from 'lucide-react';

interface ModalExpenseProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: any[];
  expVehicleId: string;
  setExpVehicleId: (val: string) => void;
  expType: string;
  setExpType: (val: string) => void;
  expAmount: string;
  setExpAmount: (val: string) => void;
  expKm: string;
  setExpKm: (val: string) => void;
  expLiters: string;
  setExpLiters: (val: string) => void;
  expEstablishment: string;
  setExpEstablishment: (val: string) => void;
  expDate: string;
  setExpDate: (val: string) => void;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
}

export function ModalExpense({
  isOpen,
  onClose,
  vehicles,
  expVehicleId,
  setExpVehicleId,
  expType,
  setExpType,
  expAmount,
  setExpAmount,
  expKm,
  setExpKm,
  expLiters,
  setExpLiters,
  expEstablishment,
  setExpEstablishment,
  expDate,
  setExpDate,
  saving,
  onSave
}: ModalExpenseProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Fuel className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Lançar Despesa de Frota</h3>
              <p className="text-xs text-zinc-400">Combustível, manutenção e custos da unidade</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Veículo *</label>
              <select
                value={expVehicleId}
                onChange={(e) => setExpVehicleId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Tipo de Custo</label>
              <select
                value={expType}
                onChange={(e) => setExpType(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Abastecimento">Abastecimento</option>
                <option value="Manutencao Preventiva">Manutenção Preventiva</option>
                <option value="Manutencao Corretiva">Manutenção Corretiva</option>
                <option value="Lavagem e Higienizacao">Lavagem e Higienização</option>
                <option value="Pedagio">Pedágio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">KM Atual</label>
              <input
                type="number"
                placeholder="Odômetro"
                value={expKm}
                onChange={(e) => setExpKm(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Litros</label>
              <input
                type="number"
                step="0.01"
                placeholder="Litros"
                value={expLiters}
                onChange={(e) => setExpLiters(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Estabelecimento / Posto</label>
              <input
                type="text"
                placeholder="Ex: Posto Petrobras Shell"
                value={expEstablishment}
                onChange={(e) => setExpEstablishment(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Data da Despesa</label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
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
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold disabled:opacity-50"
            >
              {saving ? 'Registrando...' : 'Salvar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}