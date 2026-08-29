'use client';

import React from 'react';
import { Users, Search, Plus, Printer, ShieldCheck, ShieldAlert, FileText, QrCode } from 'lucide-react';

interface PaymentItem {
  id: string;
  holder: string;
  cpf: string;
  plan: string;
  amount: number;
  due_date: string;
  status: string;
  boleto_url?: string;
}

interface AssociatesTabProps {
  payments: PaymentItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenNewAssociate: () => void;
  onPrintContract: (payment: PaymentItem) => void;
  onOpenPixModal: (payment: PaymentItem) => void;
}

export function AssociatesTab({
  payments,
  searchTerm,
  setSearchTerm,
  onOpenNewAssociate,
  onPrintContract,
  onOpenPixModal,
}: AssociatesTabProps) {
  const filtered = payments.filter(
    (p) =>
      p.holder.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cpf.includes(searchTerm)
  );

  return (
    <div className="space-y-5">
      {/* Cabeçalho e Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Gestão de Associados & Titulares</h2>
          <p className="text-xs text-zinc-400">Emissão de contratos, cobrança e visualização de inadimplência</p>
        </div>
        <button
          type="button"
          onClick={onOpenNewAssociate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Associado</span>
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por nome do titular ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      {/* Tabela de Associados */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="p-4">Titular / Associado</th>
                <th className="p-4">CPF</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Mensalidade</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs">
                    Nenhum associado encontrado para a busca informada.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{p.holder}</span>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-400 font-mono">{p.cpf}</td>
                    <td className="p-4 text-zinc-200">{p.plan}</td>
                    <td className="p-4 font-semibold text-white">
                      R$ {Number(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-zinc-400">
                      {new Date(p.due_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4">
                      {p.status === 'Pago' || p.status === 'ativo' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          Regular
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <ShieldAlert className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenPixModal(p)}
                          title="Cobrança Instantânea PIX"
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 transition"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onPrintContract(p)}
                          title="Imprimir Contrato Lei 13.261"
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
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