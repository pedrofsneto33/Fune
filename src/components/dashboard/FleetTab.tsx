'use client';

import React from 'react';
import { Car, Fuel, Wrench, ShieldCheck, AlertTriangle } from 'lucide-react';

interface VehicleItem {
  id: string;
  model: string;
  plate: string;
  status: string;
  current_km: number;
  last_maintenance_km?: number;
}

interface FleetTabProps {
  vehicles: VehicleItem[];
  onOpenExpenseModal: (vehicle: VehicleItem) => void;
}

export function FleetTab({ vehicles, onOpenExpenseModal }: FleetTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-white">Gestão da Frota de Veículos</h2>
        <p className="text-xs text-zinc-400">Controle de quilometragem, abastecimento e manutenções preventivas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((v) => {
          const isAvailable = v.status === 'disponivel' || v.status === 'disponível';
          return (
            <div key={v.id} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-sm text-white">{v.model}</span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isAvailable
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {isAvailable ? 'Disponível' : 'Em Rota'}
                </span>
              </div>

              <div className="text-xs space-y-1 text-zinc-400">
                <p>Placa: <strong className="text-zinc-200 font-mono">{v.plate}</strong></p>
                <p>Odômetro Atual: <strong className="text-zinc-200">{v.current_km.toLocaleString('pt-BR')} KM</strong></p>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onOpenExpenseModal(v)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition"
                >
                  <Fuel className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lançar Abastecimento / Despesa</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}