import { ModalCloseDispatch } from '@/components/modals/ModalCloseDispatch';
import { AuditTimeline } from '@/components/dashboard/AuditTimeline';
'use client';

import React from 'react';
import { Siren, Plus, MapPin, Clock, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface DispatchItem {
  id: string;
  deceased_name: string;
  location: string;
  driver_name: string;
  vehicle_plate: string;
  urn_type: string;
  status: string;
  created_at: string;
}

interface DispatchesTabProps {
  dispatches: DispatchItem[];
  onOpenPlantaoModal: () => void;
}

export function DispatchesTab({ dispatches, onOpenPlantaoModal }: DispatchesTabProps) {
  const [selectedDispatchForAudit, setSelectedDispatchForAudit] = React.useState<any | null>(null);
  const [selectedDispatchForClose, setSelectedDispatchForClose] = React.useState<any | null>(null);
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Central de Plantão 24 Horas</h2>
          <p className="text-xs text-zinc-400">Acionamentos de emergência, remoções e ordem de serviço fúnebre</p>
        </div>
        <button
          type="button"
          onClick={onOpenPlantaoModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-950/40 transition cursor-pointer"
        >
          <Siren className="w-4 h-4" />
          <span>Acionar Plantão 24h</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dispatches.length === 0 ? (
          <div className="col-span-full p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-zinc-500 text-xs">
            Nenhum acionamento de plantão registrado nas últimas 24 horas.
          </div>
        ) : (
          dispatches.map((d) => (
            <div key={d.id} className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded">
                  Ocorrência Ativa
                </span>
                <span className="text-[10px] text-zinc-500">
                  {new Date(d.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{d.deceased_name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{d.location}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <p>Veículo: <strong className="text-zinc-200">{d.vehicle_plate}</strong></p>
                <p>Agente: <strong className="text-zinc-200">{d.driver_name}</strong></p>
                <p>Urna Vinculada: <strong className="text-emerald-400">{d.urn_type}</strong></p>
              </div>
            </div>
          ))
        )}
      </div>      {/* Modal de Trilha de Auditoria */}
      {selectedDispatchForAudit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-white">Auditoria do Atendimento</h3>
                <p className="text-xs text-zinc-400">OS: {selectedDispatchForAudit.id} - {selectedDispatchForAudit.deceased_name || selectedDispatchForAudit.deceasedName || 'Falecido'}</p>
              </div>
              <button
                onClick={() => setSelectedDispatchForAudit(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <AuditTimeline
              dispatchId={selectedDispatchForAudit.id}
              tenantId={selectedDispatchForAudit.tenant_id}
            />

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setSelectedDispatchForAudit(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

            <ModalCloseDispatch
        isOpen={!!selectedDispatchForClose}
        onClose={() => setSelectedDispatchForClose(null)}
        dispatch={selectedDispatchForClose}
        onSuccess={() => {
          if (typeof window !== 'undefined') window.location.reload();
        }}
      />

    </div>
  );
}