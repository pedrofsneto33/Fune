'use client';

import React from 'react';
import { Search, Plus, Filter, FileText, QrCode, Users, Layers, ExternalLink } from 'lucide-react';

interface AssociatesTabProps {
  payments: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  planFilter: string;
  setPlanFilter: (filter: string) => void;
  onOpenNewHolder: () => void;
  onOpenPixModal: (payment: any) => void;
  onOpenDependentsModal: (payment: any) => void;
  onOpenBoletoModal: (payment?: any) => void;
  onGenerateReport: () => void;
}

export function AssociatesTab({
  payments,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  planFilter,
  setPlanFilter,
  onOpenNewHolder,
  onOpenPixModal,
  onOpenDependentsModal,
  onOpenBoletoModal,
  onGenerateReport
}: AssociatesTabProps) {
  const filtered = payments.filter((p) => {
    const matchSearch =
      (p.holder || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cpf || '').includes(searchTerm);
    const matchStatus = statusFilter === 'Todos' || p.status === statusFilter;
    const matchPlan = planFilter === 'Todos' || p.plan === planFilter;
    return matchSearch && matchStatus && matchPlan;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superior */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-white">Gestão de Associados & Contratos</h2>
          <p className="text-xs text-zinc-400">Controle cadastral, emissão de cobranças e dependentes.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={onGenerateReport}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-700 transition"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            Relatório Geral
          </button>
          <button
            onClick={() => onOpenBoletoModal()}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold transition"
          >
            <Layers className="w-3.5 h-3.5" />
            Emitir Carnê / Boleto
          </button>
          <button
            onClick={onOpenNewHolder}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Associado
          </button>
        </div>
      </div>

      {/* Filtros de Busca */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
        >
          <option value="Todos">Status: Todos</option>
          <option value="Pago">Pago</option>
          <option value="Pendente">Pendente</option>
          <option value="Atrasado">Atrasado</option>
        </select>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
        >
          <option value="Todos">Plano: Todos</option>
          <option value="Plano Bronze">Plano Bronze</option>
          <option value="Plano Prata">Plano Prata</option>
          <option value="Plano Ouro">Plano Ouro</option>
          <option value="Plano Familiar">Plano Familiar</option>
        </select>
      </div>

      {/* Tabela de Associados */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4 font-medium">Titular / CPF</th>
                <th className="py-3 px-4 font-medium">Plano</th>
                <th className="py-3 px-4 font-medium">Valor / Venc.</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500 italic">
                    Nenhum associado encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{item.holder}</p>
                      <p className="text-[11px] text-zinc-400 font-mono">{item.cpf || 'Sem CPF'}</p>
                    </td>
                    <td className="py-3 px-4 text-zinc-300">{item.plan}</td>
                    <td className="py-3 px-4">
                      <p className="text-white font-medium">R$ {item.amount}</p>
                      <p className="text-[11px] text-zinc-400">{item.dueDate}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.status === 'Pago'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.status === 'Pendente'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => onOpenDependentsModal(item)}
                        title="Gerenciar Dependentes"
                        className="p-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-700/50 transition inline-flex items-center gap-1"
                      >
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span className="hidden lg:inline text-[11px]">Dependentes</span>
                      </button>
                      <button
                        onClick={() => onOpenPixModal(item)}
                        title="Cobrar via PIX"
                        className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 transition inline-flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline text-[11px]">PIX</span>
                      </button>
                      <button
                        onClick={() => onOpenBoletoModal(item)}
                        title="Emitir Carnê / Boleto Asaas"
                        className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition inline-flex items-center gap-1"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline text-[11px]">Carnê</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}