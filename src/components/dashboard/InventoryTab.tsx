'use client';

import React from 'react';
import { Boxes, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
}

interface InventoryTabProps {
  inventory: InventoryItem[];
}

export function InventoryTab({ inventory }: InventoryTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-white">Controle de Estoque de Urnas & Insumos</h2>
        <p className="text-xs text-zinc-400">Monitoramento de saldo crítico para pronto atendimento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inventory.map((item) => {
          const isLow = item.quantity <= item.min_quantity;
          return (
            <div key={item.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-purple-400" />
                  {item.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {item.category} • Mínimo exigido: {item.min_quantity} un
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-base font-bold px-3 py-1 rounded-xl border inline-block ${
                    isLow
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {item.quantity} un
                </span>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {isLow ? 'Reposição Necessária' : 'Estoque Regular'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}