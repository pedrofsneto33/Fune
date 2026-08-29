'use client';

import React from 'react';
import { Siren, X } from 'lucide-react';

interface ModalPlantaoProps {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
  selectedContract: any | null;
  onSelectContract: (item: any | null) => void;
  deceasedName: string;
  setDeceasedName: (val: string) => void;
  deathLocation: string;
  setDeathLocation: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  driverAgent: string;
  setDriverAgent: (val: string) => void;
  driverPhone: string;
  setDriverPhone: (val: string) => void;
  familyContactName: string;
  setFamilyContactName: (val: string) => void;
  familyContactPhone: string;
  setFamilyContactPhone: (val: string) => void;
  selectedVehicleId: string;
  setSelectedVehicleId: (val: string) => void;
  vehicles: any[];
  urnModel: string;
  setUrnModel: (val: string) => void;
  saving: boolean;
  onConfirm: () => void;
}

export function ModalPlantao({
  isOpen,
  onClose,
  payments,
  selectedContract,
  onSelectContract,
  deceasedName,
  setDeceasedName,
  deathLocation,
  setDeathLocation,
  address,
  setAddress,
  driverAgent,
  setDriverAgent,
  driverPhone,
  setDriverPhone,
  familyContactName,
  setFamilyContactName,
  familyContactPhone,
  setFamilyContactPhone,
  selectedVehicleId,
  setSelectedVehicleId,
  vehicles,
  urnModel,
  setUrnModel,
  saving,
  onConfirm
}: ModalPlantaoProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-900 border border-red-500/40 w-full max-w-2xl rounded-2xl p-6 shadow-2xl my-8">
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Siren className="w-5 h-5 text-red-500" /> Acionamento PLANTÃO 24h
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mt-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Vincular Contrato / Associado</label>
            <select
              onChange={(e) => {
                const found = payments.find(p => p.id === e.target.value);
                onSelectContract(found || null);
              }}
              value={selectedContract?.id || ''}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="">-- Selecione o Associado ou Particular --</option>
              {payments.map(p => (
                <option key={p.id} value={p.id}>{p.holder} ({p.plan}) - Status: {p.status}</option>
              ))}
            </select>

            {selectedContract && (
              <div className={`mt-2 p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                selectedContract.status === 'Pago'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                <span>Titular: <strong>{selectedContract.holder}</strong></span>
                <span>Situação: <strong>{selectedContract.status}</strong></span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome do Falecido *</label>
              <input
                type="text"
                placeholder="Nome completo do falecido"
                value={deceasedName}
                onChange={(e) => setDeceasedName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Local do Óbito *</label>
              <input
                type="text"
                placeholder="Hospital, Residência, etc."
                value={deathLocation}
                onChange={(e) => setDeathLocation(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Endereço de Atendimento / Velório</label>
            <input
              type="text"
              placeholder="Rua, Número, Bairro, Cidade"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Contato Familiar (Nome)</label>
              <input
                type="text"
                placeholder="Nome do familiar"
                value={familyContactName}
                onChange={(e) => setFamilyContactName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Telefone da Família</label>
              <input
                type="text"
                placeholder="(86) 99999-0000"
                value={familyContactPhone}
                onChange={(e) => setFamilyContactPhone(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Veículo / Carro Fúnebre</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="">-- Selecione o Veículo --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Agente Responsável</label>
              <input
                type="text"
                value={driverAgent}
                onChange={(e) => setDriverAgent(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Urna Funerária</label>
              <input
                type="text"
                value={urnModel}
                onChange={(e) => setUrnModel(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={saving || !deceasedName || !deathLocation}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-50"
            >
              {saving ? 'Despachando...' : 'Confirmar Acionamento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}