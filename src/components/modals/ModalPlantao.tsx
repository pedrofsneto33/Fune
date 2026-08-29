'use client';

import React from 'react';
import { X, Siren, UserCheck, MapPin, Truck, Box, Phone, User } from 'lucide-react';

interface PaymentRow {
  id: string;
  holderId: string;
  holder: string;
  cpf: string;
  phone: string;
  plan: string;
  amount: string;
}

interface FleetVehicle {
  id: string;
  model: string;
  plate: string;
  status: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
}

interface ModalPlantaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  payments: PaymentRow[];
  selectedContract: PaymentRow | null;
  setSelectedContract: (c: PaymentRow | null) => void;
  deceasedName: string;
  setDeceasedName: (v: string) => void;
  deathLocation: string;
  setDeathLocation: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  driverAgent: string;
  setDriverAgent: (v: string) => void;
  vehicles: FleetVehicle[];
  selectedVehicleId: string;
  setSelectedVehicleId: (v: string) => void;
  urnModel: string;
  setUrnModel: (v: string) => void;
  familyContactName: string;
  setFamilyContactName: (v: string) => void;
  familyContactPhone: string;
  setFamilyContactPhone: (v: string) => void;
  driverPhone: string;
  setDriverPhone: (v: string) => void;
  saving: boolean;
  inventory?: InventoryItem[];
}

export function ModalPlantao({
  isOpen,
  onClose,
  onSubmit,
  payments,
  selectedContract,
  setSelectedContract,
  deceasedName,
  setDeceasedName,
  deathLocation,
  setDeathLocation,
  address,
  setAddress,
  driverAgent,
  setDriverAgent,
  vehicles,
  selectedVehicleId,
  setSelectedVehicleId,
  urnModel,
  setUrnModel,
  familyContactName,
  setFamilyContactName,
  familyContactPhone,
  setFamilyContactPhone,
  driverPhone,
  setDriverPhone,
  saving,
  inventory = []
}: ModalPlantaoProps) {
  if (!isOpen) return null;

  const availableVehicles = vehicles.filter(v => v.status === 'disponivel');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <Siren className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Acionamento de Emergência 24h</h2>
              <p className="text-xs text-zinc-400">Abertura de Ordem de Serviço e Despacho Funerário</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={onSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {/* Titular e Contrato */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Associado / Titular do Plano *</label>
            <select
              required
              value={selectedContract?.id || ''}
              onChange={(e) => {
                const found = payments.find(p => p.id === e.target.value);
                setSelectedContract(found || null);
                if (found && !familyContactName) {
                  setFamilyContactName(found.holder);
                  setFamilyContactPhone(found.phone);
                }
              }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
            >
              <option value="">Selecione o titular...</option>
              {payments.map(p => (
                <option key={p.id} value={p.id}>
                  {p.holder} ({p.cpf}) — {p.plan}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Nome do Falecido *</label>
              <input
                type="text"
                required
                placeholder="Nome completo do falecido"
                value={deceasedName}
                onChange={(e) => setDeceasedName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Local do Óbito *</label>
              <input
                type="text"
                required
                placeholder="Ex: Hospital Getúlio Vargas / Residência"
                value={deathLocation}
                onChange={(e) => setDeathLocation(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Endereço de Remoção / Velório *</label>
            <input
              type="text"
              required
              placeholder="Rua, Número, Bairro, Cidade"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Veículo Escalado *</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
              >
                <option value="">Selecione o veículo...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} disabled={v.status !== 'disponivel'}>
                    {v.model} ({v.plate}) {v.status !== 'disponivel' ? '- [EM USO]' : '- [LIVRE]'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Urna / Modelo de Estoque</label>
              <select
                value={urnModel}
                onChange={(e) => setUrnModel(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
              >
                <option value="Sextavada Luxo Ouro (Ref. 102)">Sextavada Luxo Ouro (Ref. 102)</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.name}>
                    {item.name} (Saldo: {item.quantity} un)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Agente / Motorista</label>
              <input
                type="text"
                value={driverAgent}
                onChange={(e) => setDriverAgent(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Telefone do Motorista</label>
              <input
                type="text"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Contato do Familiar</label>
              <input
                type="text"
                value={familyContactName}
                onChange={(e) => setFamilyContactName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Telefone do Familiar</label>
              <input
                type="text"
                value={familyContactPhone}
                onChange={(e) => setFamilyContactPhone(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-red-950/40 transition disabled:opacity-50"
            >
              <Siren className="w-4 h-4" />
              {saving ? 'Gerando OS...' : 'Gerar Ordem e Despachar'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
