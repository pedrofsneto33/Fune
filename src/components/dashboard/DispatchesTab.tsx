'use client';

import React from 'react';
import {
  Siren,
  Plus,
  MapPin,
  Clock,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Truck,
  Box,
  Phone,
  Search,
  CheckCircle
} from 'lucide-react';

interface DispatchRecord {
  id: string;
  protocol: string;
  deceased_name: string;
  holder_name: string;
  plan_name: string;
  death_location: string;
  address: string;
  urn_model: string;
  vehicle_id: string;
  vehicle_desc: string;
  driver_agent: string;
  family_contact_name: string;
  family_contact_phone: string;
  observations: string;
  status: string;
  created_at: string;
}

interface DispatchesTabProps {
  dispatches: DispatchRecord[];
  statusFilter: 'all' | 'em_andamento' | 'concluido';
  setStatusFilter: (s: 'all' | 'em_andamento' | 'concluido') => void;
  searchText: string;
  setSearchText: (s: string) => void;
  onCompleteDispatch: (dispatch: DispatchRecord) => void;
  onExportPDF: () => void;
  onNewDispatch: () => void;
}

export function DispatchesTab({
  dispatches = [],
  statusFilter,
  setStatusFilter,
  searchText,
  setSearchText,
  onCompleteDispatch,
  onExportPDF,
  onNewDispatch
}: DispatchesTabProps) {
  return (
    <div className="space-y-6 font-sans">
      {/* Header & Controles */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Siren className="w-5 h-5 text-red-500 animate-pulse" />
            Central de Plantão 24 Horas
          </h2>
          <p className="text-xs text-zinc-400">Acionamentos de emergência, remoções e ordem de serviço fúnebre</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por falecido, OS ou agente..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                statusFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('em_andamento')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                statusFilter === 'em_andamento' ? 'bg-red-950/60 text-red-400 border border-red-800/60' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Em Rota
            </button>
            <button
              onClick={() => setStatusFilter('concluido')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                statusFilter === 'concluido' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Concluídos
            </button>
          </div>

          <button
            onClick={onNewDispatch}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-950/40 transition shrink-0"
          >
            <Siren className="w-4 h-4" />
            Acionar Plantão 24h
          </button>
        </div>
      </div>

      {/* Grid de Ocorrências */}
      {dispatches.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
          <ShieldAlert className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-300">Nenhum acionamento localizado</p>
          <p className="text-xs text-zinc-500 mt-1">Clique em "Acionar Plantão 24h" para abrir uma nova ocorrência.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dispatches.map((dispatch) => {
            const isPending = dispatch.status === 'em_andamento';

            return (
              <div
                key={dispatch.id}
                className={`bg-zinc-900/60 border rounded-2xl p-5 flex flex-col justify-between transition relative overflow-hidden backdrop-blur ${
                  isPending
                    ? 'border-red-500/40 shadow-lg shadow-red-950/20 ring-1 ring-red-500/20'
                    : 'border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Header do Card */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPending
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isPending ? 'OCORRÊNCIA ATIVA' : 'CONCLUÍDO'}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {new Date(dispatch.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{dispatch.deceased_name}</h3>
                  <p className="text-xs text-zinc-400 mb-4">
                    Titular: <span className="text-zinc-200">{dispatch.holder_name || 'Particular'}</span>
                  </p>

                  {/* Detalhes do Despacho */}
                  <div className="space-y-2.5 text-xs text-zinc-300 py-3 border-y border-zinc-800/80">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {dispatch.death_location ? `${dispatch.death_location} — ` : ''}
                        {dispatch.address || 'Endereço não informado'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                      <span>Veículo: <strong className="text-zinc-100">{dispatch.vehicle_desc || 'Não escalado'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Agente: <strong className="text-zinc-100">{dispatch.driver_agent || 'Agente Plantonista'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">Urna: <strong className="text-zinc-100">{dispatch.urn_model || 'Padrão'}</strong></span>
                    </div>

                    {dispatch.family_contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        <span>Familiar: {dispatch.family_contact_name} ({dispatch.family_contact_phone})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="mt-4 pt-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{dispatch.protocol}</span>

                  {isPending && (
                    <button
                      onClick={() => onCompleteDispatch(dispatch)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Finalizar Missão
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
